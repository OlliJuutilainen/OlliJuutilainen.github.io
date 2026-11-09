package fi.tusinasaa.odotushuone

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var webView: WebView

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var audioManager: AudioManager

    // Taskulamppu: tila luetaan TorchCallbackista, ei oleteta. null = tila ei ole vielä tiedossa.
    private var cameraManager: CameraManager? = null
    private var torchCameraId: String? = null
    private var torchOn: Boolean? = null
    private val torchCallback = object : CameraManager.TorchCallback() {
        override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
            if (cameraId == torchCameraId) torchOn = enabled
        }
    }

    // Napit, joiden down on kulutettu: myös niiden up ja toistot kulutetaan.
    private val consumedKeys = mutableSetOf<Int>()

    // Äänenvoimakkuusnapit: pitkä painallus ja kahden napin sarja.
    private var volumeHeldKey = 0
    private var volumeLongFired = false
    private var lastShortVolumeKey = 0
    private var lastShortVolumeAt = 0L
    private var volumeBeforeLastShort = -1
    private val volumeLongPress = Runnable {
        volumeLongFired = true
        when (volumeHeldKey) {
            KeyEvent.KEYCODE_VOLUME_UP -> openTusinasaa()
            KeyEvent.KEYCODE_VOLUME_DOWN -> openPackage(PKG_TIDAL)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUi()

        audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        volumeControlStream = AudioManager.STREAM_MUSIC
        setUpTorch()

        webView = findViewById(R.id.web_view)
        configureWebView()

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(LOCAL_START_PAGE)
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUi()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
    }

    override fun onPause() {
        webView.onPause()
        webView.pauseTimers()
        super.onPause()
    }

    override fun onDestroy() {
        handler.removeCallbacks(volumeLongPress)
        cameraManager?.unregisterTorchCallback(torchCallback)
        if (::webView.isInitialized) {
            webView.apply {
                stopLoading()
                loadUrl("about:blank")
                // null ei käänny compileSdk 34:llä (parametri on @NonNull).
                webViewClient = WebViewClient()
                destroy()
            }
        }
        super.onDestroy()
    }

    // ---- Laitteen napit ----
    //
    // Napit käsitellään tässä eikä Key Mapperissa. Käsittelemättömät menevät superille.
    // Pitkän painalluksen ja sarjan erotteluun odotetaan vain äänenvoimakkuusnapeilla, joilla
    // lyhyt painallus säätää äänenvoimakkuutta. Muut napit toimivat heti down-tapahtumasta.

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val code = event.keyCode
        Log.d(TAG, "nappi $code ${if (event.action == KeyEvent.ACTION_DOWN) "down" else "up"} toisto=${event.repeatCount}")

        if (event.action != KeyEvent.ACTION_DOWN) {
            if (event.action == KeyEvent.ACTION_UP && consumedKeys.remove(code)) {
                if (code == volumeHeldKey) onVolumeUp(code)
                return true
            }
            return super.dispatchKeyEvent(event)
        }
        if (event.repeatCount > 0) {
            return if (code in consumedKeys) true else super.dispatchKeyEvent(event)
        }

        when (code) {
            KEYCODE_LP3_319 -> toggleTorch()
            KeyEvent.KEYCODE_FOCUS -> openPackage(PKG_BINARYEYE)
            KeyEvent.KEYCODE_VOLUME_UP, KeyEvent.KEYCODE_VOLUME_DOWN -> onVolumeDown(code)
            else -> return super.dispatchKeyEvent(event)
        }
        consumedKeys.add(code)
        return true
    }

    private fun onVolumeDown(code: Int) {
        val other = if (code == KeyEvent.KEYCODE_VOLUME_UP) KeyEvent.KEYCODE_VOLUME_DOWN else KeyEvent.KEYCODE_VOLUME_UP
        val now = SystemClock.uptimeMillis()
        if (lastShortVolumeKey == other && now - lastShortVolumeAt <= SEQUENCE_MS) {
            // Sarja: ensimmäinen painallus ehti jo säätää äänenvoimakkuutta, joten palautetaan se.
            lastShortVolumeKey = 0
            restoreVolume(volumeBeforeLastShort)
            volumeHeldKey = 0
            if (code == KeyEvent.KEYCODE_VOLUME_DOWN) openPackage(PKG_NATIVE_ALPHA) else openPackage(PKG_SOITIN)
            return
        }
        handler.removeCallbacks(volumeLongPress)
        volumeHeldKey = code
        volumeLongFired = false
        handler.postDelayed(volumeLongPress, LONG_PRESS_MS)
    }

    private fun onVolumeUp(code: Int) {
        handler.removeCallbacks(volumeLongPress)
        volumeHeldKey = 0
        if (volumeLongFired) return
        volumeBeforeLastShort = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val direction = if (code == KeyEvent.KEYCODE_VOLUME_UP) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER
        audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, AudioManager.FLAG_SHOW_UI)
        lastShortVolumeKey = code
        lastShortVolumeAt = SystemClock.uptimeMillis()
    }

    private fun restoreVolume(volume: Int) {
        if (volume < 0) return
        try {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, volume, 0)
        } catch (error: SecurityException) {
            Log.w(TAG, "äänenvoimakkuuden palautus ei onnistunut", error)
        }
    }

    private fun setUpTorch() {
        val manager = getSystemService(CAMERA_SERVICE) as? CameraManager ?: return
        cameraManager = manager
        try {
            val withFlash = manager.cameraIdList.filter {
                manager.getCameraCharacteristics(it).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
            torchCameraId = withFlash.firstOrNull {
                manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) ==
                    CameraCharacteristics.LENS_FACING_BACK
            } ?: withFlash.firstOrNull()
        } catch (error: CameraAccessException) {
            Log.w(TAG, "kameroita ei saatu luettua", error)
        }
        if (torchCameraId != null) manager.registerTorchCallback(torchCallback, handler)
    }

    private fun toggleTorch() {
        val manager = cameraManager ?: return
        val id = torchCameraId ?: return
        try {
            manager.setTorchMode(id, torchOn != true)
        } catch (error: CameraAccessException) {
            Log.w(TAG, "taskulamppu ei vaihtanut tilaa", error)
        } catch (error: IllegalArgumentException) {
            Log.w(TAG, "taskulamppu ei vaihtanut tilaa", error)
        }
    }

    private fun openTusinasaa() {
        val uri = Uri.parse(
            "tusinasaa://open/v1#t=${BuildConfig.TUSINASAA_TOKEN}&k=${BuildConfig.TUSINASAA_KEY}"
        )
        launch(Intent(Intent.ACTION_VIEW, uri).setPackage(PKG_TUSINASAA))
    }

    private fun openPackage(packageName: String) {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        if (intent == null) {
            Log.w(TAG, "ei käynnistettävää sovellusta: $packageName")
            return
        }
        launch(intent)
    }

    private fun launch(intent: Intent) {
        try {
            startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (error: ActivityNotFoundException) {
            Log.w(TAG, "käynnistys ei onnistunut: $intent", error)
            return
        }
        // Käyttäjän päätös 9.11.2026: Odotushuone sulkeutuu, kun se on avannut toisen sovelluksen.
        finish()
    }

    private fun configureWebView() {
        webView.apply {
            setBackgroundColor(Color.BLACK)
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            isLongClickable = false
            setOnLongClickListener { true }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    return false
                }

                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                    return false
                }

                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    val uri = request?.url ?: return super.shouldInterceptRequest(view, request)
                    return interceptLocalMedia(uri) ?: super.shouldInterceptRequest(view, request)
                }

                override fun shouldInterceptRequest(view: WebView?, url: String?): WebResourceResponse? {
                    val uri = url?.let(Uri::parse) ?: return super.shouldInterceptRequest(view, url)
                    return interceptLocalMedia(uri) ?: super.shouldInterceptRequest(view, url)
                }

                private fun interceptLocalMedia(uri: Uri): WebResourceResponse? {
                    if (uri.scheme == "file" && uri.path?.endsWith("/kello.mp3") == true) {
                        // kello.mp3 ei ole repossa tässä moduulissa (Ouroboroksella on). Nimellä
                        // haettuna moduuli kääntyy ilman sitä; puuttuva tiedosto antaa nullin.
                        @Suppress("DiscouragedApi")
                        val id = resources.getIdentifier("kello", "raw", packageName)
                        return try {
                            WebResourceResponse(
                                "audio/mpeg",
                                null,
                                resources.openRawResource(id)
                            )
                        } catch (error: Exception) {
                            null
                        }
                    }
                    return null
                }
            }

            settings.apply {
                cacheMode = WebSettings.LOAD_NO_CACHE
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                mediaPlaybackRequiresUserGesture = true
                javaScriptEnabled = false
                domStorageEnabled = false
                allowFileAccess = true
                allowFileAccessFromFileURLs = false
                allowUniversalAccessFromFileURLs = false
            }
        }
    }

    private fun hideSystemUi() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            val controller = window.insetsController ?: return
            controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
            controller.systemBarsBehavior =
                WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                )
        }
    }

    companion object {
        private const val LOCAL_START_PAGE = "file:///android_asset/index.html"
        private const val TAG = "Odotushuone"

        // Light Phone 3:n nappi, jolle Androidissa ei ole nimettyä vakiota (318 = KEYCODE_SCREENSHOT).
        private const val KEYCODE_LP3_319 = 319

        // Key Mapperin oletusarvot: pitkä painallus 500 ms, sarjan aikaraja 1000 ms.
        private const val LONG_PRESS_MS = 500L
        private const val SEQUENCE_MS = 1000L

        private const val PKG_TIDAL = "com.aspiro.wamp"
        private const val PKG_NATIVE_ALPHA = "com.cylonid.nativealpha"
        private const val PKG_SOITIN = "fi.tusinasaa.soitin"
        private const val PKG_BINARYEYE = "de.markusfisch.android.binaryeye"
        private const val PKG_TUSINASAA = "fi.tusinasaa"
    }
}
