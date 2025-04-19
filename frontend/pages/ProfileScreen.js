import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import UserService from "../services/UserService";

const ProfileUI = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [user, setUser] = useState({
    name: "",
    avatar: "",
    status: "",
    birthday: "",
    phone: "",
    email: "",
    about: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get userId from navigation params or from your auth context
        const userId = route.params?.userId;

        if (!userId) {
          throw new Error("User ID not found");
        }

        const userData = await UserService.getUserById(userId);
        setUser({
          name: userData.name || "No name provided",
          avatar: userData.avatar || "https://via.placeholder.com/150",
          status: userData.status || "Hey there! I'm using this app",
          birthday: userData.birthday || "Not specified",
          phone: userData.phone || "Not provided",
          email: userData.email || "Not provided",
          about: userData.about || "No bio yet",
        });
      } catch (error) {
        Alert.alert("Error", "Failed to load profile data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [route.params?.userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.status}>{user.status}</Text>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Birthday:</Text>
            <Text style={styles.detailValue}>{user.birthday}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{user.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.aboutContainer}>
          <Text style={styles.aboutLabel}>About Me</Text>
          <Text style={styles.aboutText}>{user.about}</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  status: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#555",
  },
  detailValue: {
    color: "#333",
  },
  aboutContainer: {
    marginBottom: 24,
  },
  aboutLabel: {
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
  },
  aboutText: {
    color: "#333",
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: "#1976d2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ProfileUI;
