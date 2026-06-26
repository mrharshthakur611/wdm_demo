import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="productCard productCardLink">
      {product.badge ? <div className="badge">{product.badge}</div> : null}
      <button type="button" className="wishlistMiniBtn" aria-label={`Add ${product.name} to wishlist`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="productImgWrap">
        <img className="productImg" src={product.imageUrl} alt={product.name} />
      </div>
      <div className="productInfo">
        <div className="productName">{product.name}</div>
        <div className="productPrice productPriceStack">
          <span className="price">{formatInr(product.price)}</span>
          {product.unit ? <span className="unit">/ {product.unit}</span> : null}
        </div>
        <span className="addBtn">
          Add to cart
        </span>
      </div>
    </Link>
  )
}

function CategoryPage({ category }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch(`/api/products?category=${category}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setProducts([])
      })
  }, [category])

  const title = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <section className="section">
      <h2 className="sectionTitle">{title}</h2>
      {products.length > 0 ? (
        <div className="productGrid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p>No products found</p>
      )}
    </section>
  )
}

export default CategoryPage
