import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useFavorites } from "../../context/FavoritesContext";
import BottomModal from "../../components/BottomModal";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("cart");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setProduct(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const handleOpenModal = (mode) => {
    setModalMode(mode);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(product)}
          >
            <Ionicons
              name={isFavorite(product.id) ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite(product.id) ? "#E53935" : "#333"}
            />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>

          {/* Name and Price */}
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>{product.price}</Text>
          </View>

          {/* Rating and Seller */}
          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.rating}>{product.rating}</Text>
            </View>
            <View style={styles.dot} />
            <Ionicons name="storefront-outline" size={14} color="#999" />
            <Text style={styles.seller}>{product.seller}</Text>
          </View>

          {/* Stock */}
          <View style={styles.stockRow}>
            <Ionicons name="cube-outline" size={14} color="#5C4033" />
            <Text style={styles.stockText}>{product.stock} items available</Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => handleOpenModal("cart")}
        >
          <Ionicons name="cart-outline" size={20} color="#5C4033" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={() => handleOpenModal("buynow")}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Modal */}
      <BottomModal
        visible={modalVisible}
        product={product}
        onClose={() => setModalVisible(false)}
        mode={modalMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F0",
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: width,
    height: 320,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: 24,
    paddingBottom: 100,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  productName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#5C4033",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
  },
  seller: {
    fontSize: 13,
    color: "#999",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  stockText: {
    fontSize: 13,
    color: "#5C4033",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0E8E0",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#5C4033",
    borderRadius: 14,
    padding: 14,
  },
  addToCartText: {
    color: "#5C4033",
    fontSize: 15,
    fontWeight: "bold",
  },
  buyNowButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5C4033",
    borderRadius: 14,
    padding: 14,
  },
  buyNowText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDF6F0",
  },
});