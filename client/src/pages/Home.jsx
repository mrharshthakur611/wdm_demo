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

function CategoryPills() {
  const items = [
    { label: 'Groceries', path: '/grocery' },
    { label: 'Food', path: '/food' },
    { label: 'Essentials', path: '/essentials' },
    { label: 'Bakery', path: '/bakery' },
  ]

  return (
    <div className="categoryPills" role="navigation" aria-label="Categories">
      {items.map((item) => (
        <Link key={item.label} className="pill" to={item.path}>
          {item.label}
        </Link>
      ))}
    </div>
  )
}

function PromoCard({ tone, eyebrow, title, subtitle, cta }) {
  return (
    <div className={`promoCard ${tone || ''}`}>
      {eyebrow ? <div className="promoEyebrow">{eyebrow}</div> : null}
      {title ? <div className="promoTitle">{title}</div> : null}
      {subtitle ? <div className="promoSub">{subtitle}</div> : null}
      {cta ? (
        <a className="promoCta" href="#shop">
          {cta}
        </a>
      ) : null}
    </div>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="heroGrid">
        <div className="heroMain">
          <PromoCard
            tone="green"
            eyebrow="Get Discounts on Fresh Vegetables & Fruits"
            title="Up to - 10%"
            subtitle="Discount will apply when you order products with our delivery from 11 am - 4 pm"
            cta="Shop Now"
          />
        </div>
        <div className="heroSide">
          <PromoCard
            tone="cream"
            eyebrow="Save up 30% on"
            title="The Original Oatly milk"
            subtitle="Promotion runs 05/10/2024 - 15/01/2024"
          />
          <PromoCard
            tone="blue"
            eyebrow="Get pack of fish at a discount"
            title="Every 3rd unit"
            subtitle="Limited weekly deal"
          />
        </div>
      </div>

      <div className="heroStrip">
        <PromoCard tone="light" eyebrow="Free Delivery" title="On orders above ₹199" />
        <PromoCard tone="light" eyebrow="For Own Baked Goods" title="Fresh daily items" />
        <PromoCard tone="light" eyebrow="Save up to 35% on" title="Energy Drinks" cta="Shop Now" />
      </div>
    </section>
  )
}

function FeatureStrip() {
  const items = [
    { title: 'Fresh Products Every Day', sub: 'Curated for Mussoorie' },
    { title: 'Safe Payment With Any Bank Card', sub: 'Fast and secure checkout' },
    { title: '24/7 Support', sub: 'Always be there for you' },
  ]

  return (
    <section className="features" aria-label="Highlights">
      {items.map((item) => (
        <div key={item.title} className="feature">
          <div className="featureIcon" aria-hidden="true"></div>
          <div className="featureText">
            <div className="featureTitle">{item.title}</div>
            <div className="featureSub">{item.sub}</div>
          </div>
        </div>
      ))}
    </section>
  )
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

function Section({ title, action, children }) {
  return (
    <section className="section">
      <div className="sectionHead">
        <h2 className="sectionTitle">{title}</h2>
        {action ? (
          <a className="sectionAction" href="#shop">
            {action}
          </a>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function CategoryGrid() {
  const items = [
    {
      title: 'GROCERY',
      imageUrl: '/wdm-images/cat-groceries.jpg',
      path: '/grocery',
    },
    {
      title: 'ESSENTIALS',
      imageUrl: '/wdm-images/cat-party.jpg',
      path: '/essentials',
    },
    {
      title: 'BAKERY',
      imageUrl: '/wdm-images/cat-cakes.jpg',
      path: '/bakery',
    },
  ]

  return (
    <div className="categoryGrid">
      {items.map((item) => (
        <Link key={item.title} className="categoryCard" to={item.path}>
          <img className="categoryImg" src={item.imageUrl} alt={item.title} />
          <div className="categoryTitle">{item.title}</div>
        </Link>
      ))}
    </div>
  )
}

function Home() {
  const [weeklyDiscounts, setWeeklyDiscounts] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])

  useEffect(() => {
    Promise.all([
      fetch('/api/products?section=weekly-discounts').then((r) => r.json()),
      fetch('/api/products?section=recently-viewed').then((r) => r.json()),
    ])
      .then(([weekly, recent]) => {
        setWeeklyDiscounts(Array.isArray(weekly) ? weekly : [])
        setRecentlyViewed(Array.isArray(recent) ? recent : [])
      })
      .catch(() => {
        setWeeklyDiscounts([])
        setRecentlyViewed([])
      })
  }, [])

  return (
    <>
      <CategoryPills />
      <Hero />
      <FeatureStrip />

      <Section title="Recently Viewed">
        <div className="rowScroll">
          {recentlyViewed.map((p) => (
            <div key={p.id} className="rowItem">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Popular Categories">
        <CategoryGrid />
      </Section>

      <Section title="Weekly Discounts" action="All Products">
        <div className="productGrid">
          {weeklyDiscounts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>
    </>
  )
}

export default Home
