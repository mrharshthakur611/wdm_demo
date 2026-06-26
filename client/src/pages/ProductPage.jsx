import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function ProductPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [status, setStatus] = useState('loading')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    setStatus('loading')

    fetch(`/api/products/${productId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Product not found')
        }

        return response.json()
      })
      .then((data) => {
        setProduct(data)
        setStatus('ready')
      })
      .catch(() => {
        setProduct(null)
        setStatus('error')
      })
  }, [productId])

  const breadcrumbs = useMemo(() => {
    if (!product) return []

    return [
      { label: 'Home', path: '/' },
      { label: product.category.toUpperCase(), path: `/${product.category}` },
      { label: product.name, path: null },
    ]
  }, [product])

  const stockCount = useMemo(() => {
    if (!product) return 0
    return Math.max(25, product.price * 5 + 125)
  }, [product])

  const watchingCount = useMemo(() => {
    if (!product) return 0
    return Math.max(8, Math.round((product.price || 10) / 4))
  }, [product])

  if (status === 'loading') {
    return <section className="productPageState">Loading product...</section>
  }

  if (status === 'error' || !product) {
    return <section className="productPageState">Product not found.</section>
  }

  return (
    <section className="productPage">
      <div className="productPageTop">
        <div className="productGalleryCard">
          {product.badge ? <div className="productPageBadge">{product.badge}</div> : null}
          <img className="productPageImage" src={product.imageUrl} alt={product.name} />
        </div>

        <div className="productDetailsCard">
          <nav className="productBreadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={item.label} className="productBreadcrumbItem">
                {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
                {index < breadcrumbs.length - 1 ? <span className="productBreadcrumbSep">/</span> : null}
              </span>
            ))}
          </nav>

          <h1 className="productPageTitle">{product.name}</h1>

          <div className="productPagePriceRow">
            <span className="productPagePrice">{formatInr(product.mrp ?? product.price)}</span>
            {product.unit ? <span className="productPageUnit">/ {product.unit}</span> : null}
          </div>

          <div className="productPageStock"> {stockCount} in stock</div>

          <div className="productPurchaseRow">
            <div className="productQtyBox">
              <button
                type="button"
                className="productQtyBtn"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                -
              </button>
              <span className="productQtyValue">{quantity}</span>
              <button
                type="button"
                className="productQtyBtn"
                onClick={() => setQuantity((value) => value + 1)}
              >
                +
              </button>
            </div>

            <button type="button" className="productAddToCartBtn">
              Add To Cart
            </button>
          </div>

          <button type="button" className="productWishlistBtn">
            Add to wishlist
          </button>

          <div className="productWatchingBox">
            {watchingCount} People watching this product now!
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductPage
