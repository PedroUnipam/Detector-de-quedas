import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Redirect href="/(auth)/login" />
    </View>
  );
}
