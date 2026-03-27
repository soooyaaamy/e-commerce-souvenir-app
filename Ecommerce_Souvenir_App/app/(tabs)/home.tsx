import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useFavorites } from "../../context/FavoritesContext";

const { width } = Dimensions.get("window");

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  rating: string;
  description?: string;
  stock: number;
}

const categories = [
  { id: "all", name: "All", icon: "grid-outline" as const },
  { id: "crafts", name: "Crafts", icon: "color-palette-outline" as const },
  { id: "clothing", name: "Clothing", icon: "shirt-outline" as const },
  { id: "food", name: "Food", icon: "restaurant-outline" as const },
  { id: "decor", name: "Decor", icon: "home-outline" as const },
];

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const productsData: Product[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Welcome! 👋</Text>
          <Text style={styles.subGreeting}>Find your perfect souvenir</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search souvenirs..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Discover Local{"\n"}Treasures</Text>
          <Text style={styles.bannerSubtitle}>Authentic Filipino Crafts</Text>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.bannerButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bannerImageContainer}>
          <Ionicons name="gift-outline" size={100} color="rgba(255,255,255,0.5)" />
        </View>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryItem,
              selectedCategory === cat.id && styles.categoryItemActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon}
              size={22}
              color={selectedCategory === cat.id ? "#fff" : "#5C4033"}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured / Filtered Products */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === "all" ? "Featured Products" : `${categories.find(c => c.id === selectedCategory)?.name}`}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productsGrid}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          filteredProducts.slice(0, 6).map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}` as any)}
            >
              <View style={styles.productImageContainer}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                />
                <TouchableOpacity
                  style={styles.wishlistButton}
                  onPress={() => toggleFavorite(product)}
                >
                  <Ionicons
                    name={isFavorite(product.id) ? "heart" : "heart-outline"}
                    size={18}
                    color={isFavorite(product.id) ? "#E53935" : "#5C4033"}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <View style={styles.productBottom}>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.rating}>{product.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#5C4033",
  },
  subGreeting: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  banner: {
    backgroundColor: "#5C4033",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    overflow: "hidden",
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 14,
  },
  bannerButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: "#5C4033",
    fontWeight: "bold",
    fontSize: 13,
  },
  bannerImageContainer: {
    opacity: 0.4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5C4033",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAll: {
    color: "#B07D62",
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingLeft: 20,
    marginBottom: 25,
  },
  categoryItem: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    flexDirection: "row",
    gap: 6,
  },
  categoryItemActive: {
    backgroundColor: "#5C4033",
  },
  categoryText: {
    fontSize: 13,
    color: "#5C4033",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#fff",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: (width - 45) / 2,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  productImageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#5C4033",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rating: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});