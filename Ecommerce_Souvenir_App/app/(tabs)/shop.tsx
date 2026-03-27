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
import { useFavorites } from "../../context/FavoritesContext";
import { useRouter } from "expo-router";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import BottomModal from "../../components/BottomModal";

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
  { id: "all", name: "All" },
  { id: "crafts", name: "Crafts" },
  { id: "clothing", name: "Clothing" },
  { id: "food", name: "Food" },
  { id: "decor", name: "Decor" },
];

const sortOptions = ["Default", "Price: Low to High", "Price: High to Low", "Top Rated"];

export default function ShopScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("Default");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<"cart" | "buynow">("cart");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  const router = useRouter();

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

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setModalMode("cart");
    setModalVisible(true);
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const priceA = parseInt(a.price.replace("₱", ""));
      const priceB = parseInt(b.price.replace("₱", ""));
      if (selectedSort === "Price: Low to High") return priceA - priceB;
      if (selectedSort === "Price: High to Low") return priceB - priceA;
      if (selectedSort === "Top Rated") return parseFloat(b.rating) - parseFloat(a.rating);
      return 0;
    });

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        

        {/* Search and Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Button */}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="options-outline" size={22} color="#5C4033" />
          </TouchableOpacity>
        </View>

        {/* Sort Dropdown */}
        {showSortMenu && (
          <View style={styles.sortMenu}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.sortOption}
                onPress={() => {
                  setSelectedSort(option);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    selectedSort === option && styles.sortOptionActive,
                  ]}
                >
                  {option}
                </Text>
                {selectedSort === option && (
                  <Ionicons name="checkmark" size={16} color="#5C4033" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Categories */}
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

        {/* Results Count */}
        <Text style={styles.resultsText}>
          {filteredProducts.length} products found
        </Text>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            filteredProducts.map((product) => (
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
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
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
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.rating}>{product.rating}</Text>
                  </View>
                  <View style={styles.productBottom}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenModal(product);
                      }}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      {/* Bottom Modal */}
      <BottomModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        mode={modalMode}
      />
    </>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5C4033",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 15,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  sortButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sortMenu: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
    zIndex: 999,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sortOptionText: {
    fontSize: 14,
    color: "#555",
  },
  sortOptionActive: {
    color: "#5C4033",
    fontWeight: "bold",
  },
  categoriesContainer: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  categoryItem: {
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
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
  resultsText: {
    paddingHorizontal: 20,
    fontSize: 13,
    color: "#999",
    marginBottom: 10,
    marginTop: 5,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    justifyContent: "space-between",
    paddingBottom: 100,
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
    width: "100%",
    height: 140,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
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
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    color: "#666",
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
  addButton: {
    backgroundColor: "#5C4033",
    borderRadius: 8,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    width: "100%",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});