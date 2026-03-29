import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const router = useRouter();

  const [manageProfileModal, setManageProfileModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [trackOrdersModal, setTrackOrdersModal] = useState(false);
  const [orderHistoryModal, setOrderHistoryModal] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);

  const pendingUnsub = React.useRef<(() => void) | null>(null);
  const completedUnsub = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchUser();

  // Count pending orders on load for the notification badge
  const user = auth.currentUser;
  if (!user) return;
  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    where("status", "==", "pending")
  );
  const unsub = onSnapshot(q, (snapshot) => {
    setPendingOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
  return () => unsub();
  }, []);

  const fetchUser = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      setUserEmail(user.email || "");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      clearTimeout(timeout);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.name || "");
        setUserPhoto(data.photoURL || "");
      }
    } catch (e: any) {
      console.log("fetchUser error:", e.message);
    }
  };

  const subscribeOrders = (status: "pending" | "completed") => {
    const user = auth.currentUser;
    if (!user) {
      if (status === "pending") setPendingLoading(false);
      else setCompletedLoading(false);
      return;
    }
    if (status === "pending") setPendingLoading(true);
    else setCompletedLoading(true);

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      where("status", "==", status)
    );

    const timeout = setTimeout(() => {
      if (status === "pending") setPendingLoading(false);
      else setCompletedLoading(false);
    }, 8000);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        clearTimeout(timeout);
        const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (status === "pending") {
          setPendingOrders(orders);
          setPendingLoading(false);
        } else {
          setCompletedOrders(orders);
          setCompletedLoading(false);
        }
      },
      (error) => {
        clearTimeout(timeout);
        console.log("Firestore error:", error.code, error.message);
        Alert.alert("Orders Error", error.message);
        if (status === "pending") setPendingLoading(false);
        else setCompletedLoading(false);
      }
    );

    if (status === "pending") pendingUnsub.current = unsubscribe;
    else completedUnsub.current = unsubscribe;
  };

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

  const openManageProfile = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setManageProfileModal(true);
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setProfileLoading(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user!.uid), {
        name: editName.trim(),
        email: editEmail.trim(),
        photoURL: userPhoto,
      });
      setUserName(editName.trim());
      setUserEmail(editEmail.trim());
      setManageProfileModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      const user = auth.currentUser!;
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password changed successfully!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setPasswordLoading(false);
  };

  const handleConfirmReceived = async (orderId: string) => {
    Alert.alert("Confirm Receipt", "Have you received your order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Received",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "orders", orderId), { status: "completed", dateReceived: serverTimestamp(), });
            setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
            Alert.alert("Thank you!", "Your order has been marked as received.");
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
    color = "#333",
    badge,
  }: {
    icon: any;
    label: string;
    onPress?: () => void;
    color?: string;
    badge?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}  contentContainerStyle={{ flexGrow: 1 }}>

      {/* ── Header: avatar centered on background color ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : "?"}
            </Text>
          )}
        </View>
        <Text style={styles.userName}>{userName || "User"}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      {/* ── White body curves up over the header ── */}
      <View style={styles.bodyCard}>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <MenuItem icon="person-outline" label="Manage Profile" onPress={openManageProfile} />
          <View style={styles.separator} />
          <MenuItem icon="lock-closed-outline" label="Password & Security" onPress={() => setPasswordModal(true)} />
        </View>

        {/* Orders Section */}
        {/* Orders Section */}
<Text style={styles.sectionLabel}>Orders</Text>
<View style={styles.section}>
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => { subscribeOrders("pending"); setTrackOrdersModal(true); }}
  >
    <View style={styles.menuLeft}>
      <View>
        <Ionicons name="time-outline" size={20} color="#333" />
        {pendingOrders.length > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>
              {pendingOrders.length > 99 ? "99+" : pendingOrders.length}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.menuLabel}>Track Orders</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#ccc" />
  </TouchableOpacity>
  <View style={styles.separator} />
  <MenuItem
    icon="receipt-outline"
    label="Order History"
    onPress={() => { subscribeOrders("completed"); setOrderHistoryModal(true); }}
  />
</View>

        {/* Logout */}
        <View style={styles.section}>
          <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} color="#E53935" />
        </View>

        <View style={{ height: 40 }} />
      </View>

      {/* ── Manage Profile Modal ── */}
      <Modal visible={manageProfileModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Profile</Text>
              <TouchableOpacity onPress={() => setManageProfileModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.avatarPicker} onPress={handlePickPhoto}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.avatarLarge} />
              ) : (
                <View style={styles.avatarLargePlaceholder}>
                  <Text style={styles.avatarLargeText}>
                    {editName ? editName.charAt(0).toUpperCase() : "?"}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#ccc"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter your email"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.saveButton, profileLoading && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={profileLoading}
            >
              {profileLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Password & Security Modal ── */}
      <Modal visible={passwordModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => {
                setPasswordModal(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#ccc"
                secureTextEntry={!showCurrent}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#ccc"
                secureTextEntry={!showNew}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#ccc"
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, passwordLoading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={passwordLoading}
            >
              {passwordLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Change Password</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Track Orders Modal ── */}
      <Modal visible={trackOrdersModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, styles.modalSheetTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Orders</Text>
              <TouchableOpacity onPress={() => {
                setTrackOrdersModal(false);
                pendingUnsub.current?.();
                pendingUnsub.current = null;
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {pendingLoading ? (
              <ActivityIndicator color="#5C4033" style={{ marginTop: 40 }} />
            ) : pendingOrders.length === 0 ? (
              <View style={styles.emptyOrders}>
                <Ionicons name="time-outline" size={60} color="#D4B8A8" />
                <Text style={styles.emptyOrdersText}>No pending orders</Text>
              </View>
            ) : (
              <FlatList
                data={pendingOrders}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                      <Text style={styles.orderDate}>
                        {item.dateReceived?.toDate
                          ? "Received: " +
                            item.dateReceived.toDate().toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Processing..."}
                      </Text>
                    </View>
                    {item.items?.map((product: any, index: number) => (
                      <View key={index} style={styles.orderItemRow}>
                        <Text style={styles.orderItemName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.orderItemQty}>x{product.quantity}</Text>
                      </View>
                    ))}
                    <View style={styles.orderCardDivider} />
                    <View style={styles.orderTotalsRow}>
                      <Text style={styles.orderTotalLabel}>Shipping</Text>
                      <Text style={styles.orderTotalValue}>₱{item.shippingFee}</Text>
                    </View>
                    <View style={styles.orderTotalsRow}>
                      <Text style={styles.orderGrandLabel}>Total</Text>
                      <Text style={styles.orderGrandValue}>₱{item.grandTotal}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.receivedButton}
                      onPress={() => handleConfirmReceived(item.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={styles.receivedButtonText}>Confirm Received</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Order History Modal ── */}
      <Modal visible={orderHistoryModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, styles.modalSheetTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order History</Text>
              <TouchableOpacity onPress={() => {
                setOrderHistoryModal(false);
                completedUnsub.current?.();
                completedUnsub.current = null;
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {completedLoading ? (
              <ActivityIndicator color="#5C4033" style={{ marginTop: 40 }} />
            ) : completedOrders.length === 0 ? (
              <View style={styles.emptyOrders}>
                <Ionicons name="receipt-outline" size={60} color="#D4B8A8" />
                <Text style={styles.emptyOrdersText}>No completed orders yet</Text>
              </View>
            ) : (
              <FlatList
                data={completedOrders}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                      <View>
                      <Text style={styles.orderDate}>
                        Ordered: {item.createdAt?.toDate?.().toLocaleDateString("en-PH")}
                      </Text>

                      {item.dateReceived?.toDate && (
                        <Text style={styles.orderDate}>
                          Received: {item.dateReceived.toDate().toLocaleDateString("en-PH")}
                        </Text>
                      )}
                    </View>
                    </View>
                    {item.items?.map((product: any, index: number) => (
                      <View key={index} style={styles.orderItemRow}>
                        <Text style={styles.orderItemName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.orderItemQty}>x{product.quantity}</Text>
                      </View>
                    ))}
                    <View style={styles.orderCardDivider} />
                    <View style={styles.orderTotalsRow}>
                      <Text style={styles.orderTotalLabel}>Shipping</Text>
                      <Text style={styles.orderTotalValue}>₱{item.shippingFee}</Text>
                    </View>
                    <View style={styles.orderTotalsRow}>
                      <Text style={styles.orderGrandLabel}>Total</Text>
                      <Text style={styles.orderGrandValue}>₱{item.grandTotal}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ── Container & Header ───────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#5C4033", // matches header so no seam
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 50,
    backgroundColor: "#5C4033",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.6)",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#5C4033",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },

  // ── White Body Card ──────────────────────────────────────────
  bodyCard: {
  backgroundColor: "#FDF6F0",
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  marginTop: -24,
  paddingTop: 28,
  flexGrow: 1,        // ← replaces minHeight, stretches to fill remaining space
},

  // ── Sections ─────────────────────────────────────────────────
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
  badge: {
    backgroundColor: "#FDF6F0",
    borderWidth: 1,
    borderColor: "#D4B8A8",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5C4033",
  },
  separator: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
  },

  // ── Modals ───────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalSheetTall: {
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },

  // ── Avatar Picker ────────────────────────────────────────────
  avatarPicker: {
    alignSelf: "center",
    marginBottom: 24,
    position: "relative",
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarLargePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#5C4033",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#5C4033",
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // ── Inputs ───────────────────────────────────────────────────
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F5F0EC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#333",
    marginBottom: 14,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0EC",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#333",
  },

  // ── Buttons ──────────────────────────────────────────────────
  saveButton: {
    backgroundColor: "#5C4033",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  // ── Orders ───────────────────────────────────────────────────
  emptyOrders: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyOrdersText: {
    fontSize: 15,
    color: "#999",
  },
  orderCard: {
    backgroundColor: "#FDF6F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: "#FFF3CD",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#856404",
  },
  completedBadge: {
    backgroundColor: "#D4EDDA",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#155724",
  },
  orderDate: {
    fontSize: 12,
    color: "#999",
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderItemName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  orderItemQty: {
    fontSize: 13,
    color: "#999",
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: "#E8D5B7",
    marginVertical: 10,
  },
  orderTotalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderTotalLabel: {
    fontSize: 13,
    color: "#999",
  },
  orderTotalValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  orderGrandLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  orderGrandValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#5C4033",
  },
  receivedButton: {
    backgroundColor: "#5C4033",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  receivedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  notifBadge: {
  position: "absolute",
  top: -5,
  right: -6,
  backgroundColor: "#E53935",
  borderRadius: 10,
  minWidth: 16,
  height: 16,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 3,
},
notifBadgeText: {
  color: "#fff",
  fontSize: 9,
  fontWeight: "bold",
},
});