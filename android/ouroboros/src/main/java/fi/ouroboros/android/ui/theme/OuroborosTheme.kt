package fi.ouroboros.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    primary = OuroborosPrimary,
    onPrimary = OuroborosOnPrimary,
    secondary = OuroborosSecondary,
    onSecondary = OuroborosOnSecondary,
    background = OuroborosBackground,
    onBackground = OuroborosOnBackground,
    surface = OuroborosSurface,
    onSurface = OuroborosOnSurface,
)

@Composable
fun OuroborosTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        typography = MaterialTheme.typography,
        content = content
    )
}
