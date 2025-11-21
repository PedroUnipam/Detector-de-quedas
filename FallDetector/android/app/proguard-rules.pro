# --- PROGUARD RULES PARA EXPO SDK 54 / RN 0.76 ---

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Hermes (evita crash ao minificar)
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native Core
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# TurboModules
-keep class com.facebook.fbreact.specs.** { *; }
-keep class com.facebook.react.codegen.** { *; }

# Evita remoção de métodos usados por reflexão no RN
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Evita warnings do OkHttp e Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**

# Evita warnings de animações e layout
-dontwarn com.facebook.yoga.**

# Se usar WebView do Expo
-dontwarn com.reactnativecommunity.webview.**

# ⛔ (Opcional) Caso use Firebase JS no futuro:
# -keep class com.google.firebase.** { *; }
# -dontwarn com.google.firebase.**

# Segurança: não minimizar classes baseadas em assets
-keep class expo.modules.** { *; }
-keep class expo.modules.kotlin.** { *; }

# =====================================================
# Adicione abaixo qualquer regra específica que desejar
# =====================================================
