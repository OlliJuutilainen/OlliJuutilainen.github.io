package fi.ouroboros.android

import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

private const val TAG = "Ouroboros"

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        Log.i(TAG, "onCreate start")
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Color.Black) {
                    DebugPreview()
                }
            }
        }

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.decorView.post { enableImmersiveMode() }
        Log.i(TAG, "onCreate finish")
    }

    override fun onStart() {
        super.onStart()
        Log.i(TAG, "onStart")
    }

    override fun onResume() {
        super.onResume()
        Log.i(TAG, "onResume")
        window.decorView.post { enableImmersiveMode() }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            Log.i(TAG, "onWindowFocusChanged: hasFocus")
            window.decorView.post { enableImmersiveMode() }
        }
    }

    private fun enableImmersiveMode() {
        val decorView = runCatching { window.decorView }.getOrNull()
        if (decorView == null) {
            Log.w(TAG, "enableImmersiveMode: decorView is null, skipping")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val controller = WindowInsetsControllerCompat(window, decorView)
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(
                WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars()
            )
        } else {
            @Suppress("DEPRECATION")
            decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                )
        }

        Log.i(TAG, "Immersive mode enabled")
    }
}

@Composable
private fun DebugPreview() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF444444))
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Ouroboros debug",
                fontSize = 16.sp,
                color = Color(0xFFCCCCCC),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

/*
Debug install snippet:
./gradlew :ouroboros:installDebug -Pandroid.injected.device.serial=LP3LHMA541401108
AAPT=$(find "$HOME/Library/Android/sdk/build-tools" -name aapt -type f | sort | tail -1)
APK=$(ls -t ouroboros/build/outputs/apk/debug/*.apk | head -1)
PKG=$($AAPT dump badging "$APK" | sed -n "s/.*name='\([^']\+\)'.*/\1/p")
LAUNCH=$(adb -s LP3LHMA541401108 shell cmd package resolve-activity --brief \
  -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$PKG" | tr -d '\r')
adb -s LP3LHMA541401108 logcat -c
adb -s LP3LHMA541401108 shell am start -W "$LAUNCH"
adb -s LP3LHMA541401108 logcat -d | egrep -i "FATAL EXCEPTION|AndroidRuntime|ActivityThread" | tail -n 200
*/
