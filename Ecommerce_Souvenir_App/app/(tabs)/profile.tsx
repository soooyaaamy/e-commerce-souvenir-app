import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email || "");
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserName(docSnap.data().name);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/login");
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    label,
    value,
    onPress,
    color = "#333",
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userName ? userName.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName || "User"}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
      </View>

      {/* Account Section */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.section}>
        <MenuItem icon="person-outline" label="Manage Profile" />
        <View style={styles.separator} />
        <MenuItem icon="lock-closed-outline" label="Password & Security" />
        <View style={styles.separator} />
        <MenuItem icon="notifications-outline" label="Notifications" />
        <View style={styles.separator} />
        <MenuItem icon="location-outline" label="My Addresses" />
      </View>

      {/* Orders Section */}
      <Text style={styles.sectionLabel}>Orders</Text>
      <View style={styles.section}>
        <MenuItem icon="receipt-outline" label="Order History" />
        <View style={styles.separator} />
        <MenuItem icon="time-outline" label="Track Orders" />
      </View>

      {/* Preferences Section */}
      <Text style={styles.sectionLabel}>Preferences</Text>
      <View style={styles.section}>
        <MenuItem icon="language-outline" label="Language" value="English" />
        <View style={styles.separator} />
        <MenuItem icon="information-circle-outline" label="About Us" />
        <View style={styles.separator} />
        <MenuItem icon="help-circle-outline" label="Help Center" />
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <MenuItem
          icon="log-out-outline"
          label="Logout"
          onPress={handleLogout}
          color="#E53935"
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: "#F5F5F5",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  userCard: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#5C4033",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#999",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    color: "#333",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menuValue: {
    fontSize: 13,
    color: "#999",
  },
  separator: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
  },
});