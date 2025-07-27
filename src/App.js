import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetch('https://dummyjson.com/products')
      .then((res) => res.json())
      .then((json) => {
        setProducts(json.products || []);
      });
  }, []);

  const addToCart = (product) => {
    if (!currentUser) {
      setNotification({ type: 'error', message: 'Please login first to add items to cart.' });
      return;
    }
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleRegister = (username, password) => {
    if (!username || !password) {
      setNotification({ type: 'error', message: 'Please enter both username and password.' });
      return false;
    }
    if (users.find((u) => u.username === username)) {
      setNotification({ type: 'error', message: 'Username already taken.' });
      return false;
    }
    const newUser = { username, password };
    setUsers((prev) => [...prev, newUser]);
    setNotification({ type: 'success', message: 'Registration successful! Please login.' });
    return true;
  };

  const handleLogin = (username, password) => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      setNotification({ type: 'success', message: `Welcome back, ${username}!` });
      return true;
    } else {
      setNotification({ type: 'error', message: 'Invalid username or password.' });
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
  };

  return (
    <Router>
      <AppContent
        products={products}
        cart={cart}
        setCart={setCart}
        addToCart={addToCart}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        notification={notification}
        setNotification={setNotification}
      />
    </Router>
  );
}

function AppContent({
  products,
  cart,
  setCart,
  addToCart,
  currentUser,
  onLogin,
  onRegister,
  onLogout,
  notification,
  setNotification,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isCartPage = location.pathname === '/cart';
  const isProductPage = location.pathname.startsWith('/product/');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter(
    (p) =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="App">
      <div className="top-bar">
        {!isCartPage ? (
          <div className="left-side">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : (
          <div className="left-side">
          </div>
        )}

        <div className="right-side">
          {currentUser ? (
            <>
              <span style={{ marginRight: '10px' }}>
                Hello, <strong>{currentUser.username}</strong>
              </span>
              {!isCartPage && (
                <Link to="/cart" className="cart-button">
                  🛒 Go to Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
                </Link>
              )}
              {isCartPage && (
                <button
                  onClick={() => navigate('/')}
                  className="cart-button"
                >
                  🏬 Continue Shopping
                </button>
              )}
              <button className="logout-button" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              {!isCartPage && (
                <Link to="/cart" className="cart-button">
                  🛒 Go to Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
                </Link>
              )}
              {isCartPage && (
                <button
                  onClick={() => navigate('/')}
                  className="cart-button"
                >
                  🏬 Continue Shopping
                </button>
              )}

              <button
                className="login-button"
                onClick={() => setShowLoginModal(true)}
              >
                Login
              </button>
              <button
                className="register-button"
                onClick={() => setShowRegisterModal(true)}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {!isCartPage && !isProductPage && (
        <div className="tabs">
          <button
            className={activeCategory === 'All' ? 'active' : ''}
            onClick={() => setActiveCategory('All')}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      <Routes>
        <Route path="/" element={<ProductList products={filteredProducts} />} />
        <Route
          path="/product/:id"
          element={<ProductDetail products={products} addToCart={addToCart} />}
        />
        <Route
          path="/cart"
          element={<CartSummary cart={cart} setCart={setCart} />}
        />
      </Routes>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(u, p) => {
            const success = onLogin(u, p);
            if (success) setShowLoginModal(false);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onRegister={(u, p) => {
            const success = onRegister(u, p);
            if (success) setShowRegisterModal(false);
          }}
        />
      )}

      {notification && (
        <CustomNotification 
          notification={notification} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
}

function ProductList({ products }) {
  return (
    <div className="product-list">
      {products.map((product) => (
        <Link
          key={product.id}
          to={`/product/${product.id}`}
          className="product-card"
        >
          <div className="product-image-frame">
            <img src={product.thumbnail} alt={product.title} />
          </div>
          <div className="product-info-frame">
            <h3>{product.title}</h3>
            <p>${product.price}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProductDetail({ products, addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === parseInt(id));
  const [popupContent, setPopupContent] = useState('');
  const [popupTitle, setPopupTitle] = useState('');

  if (!product) return <p>Loading product details...</p>;

  const handleShowInfo = () => {
    setPopupTitle('Product Info');
    setPopupContent(
      Object.entries(product)
        .map(([key, value]) => {
          if (
            [
              'id',
              'title',
              'price',
              'thumbnail',
              'description',
              'reviews',
              'images',
            ].includes(key)
          )
            return null;
          return `<p><strong>${
            key.charAt(0).toUpperCase() + key.slice(1)
          }:</strong> ${
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          }</p>`;
        })
        .join('')
    );
  };

  const handleShowReviews = () => {
    setPopupTitle('Customer Reviews');
    setPopupContent(
      product.reviews
        .map(
          (review) =>
            `<div class='review'><p><strong>${review.reviewerName}</strong> (${
              review.rating
            }★)</p><p>${review.comment}</p><p><small>${new Date(
              review.date
            ).toLocaleDateString()}</small></p></div>`
        )
        .join('')
    );
  };

  return (
    <div className="product-detail">
      <h1>{product.title}</h1>
      <div className="product-detail-content">
        <div className="product-detail-image-frame">
          <img src={product.thumbnail} alt={product.title} />
          <div className="side-buttons">
            <button
              onClick={handleShowInfo}
              style={{
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                margin: '5px',
              }}
            >
              Show Info
            </button>
            <button
              onClick={handleShowReviews}
              style={{
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                margin: '5px',
              }}
            >
              Read Reviews
            </button>
          </div>
        </div>
        <div className="product-basic-info">
          <p className="product-price">Price: ${product.price}</p>
          <p className="product-description">{product.description}</p>
        </div>
      </div>

      {popupContent && (
        <div
          className="popup-overlay"
          onClick={() => setPopupContent('')}
        >
          <div
            className="enhanced-popup-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popup-header">
              <h2>{popupTitle}</h2>
              <button
                className="close-x"
                onClick={() => setPopupContent('')}
              >
                ×
              </button>
            </div>
            <div
              className="popup-content"
              dangerouslySetInnerHTML={{ __html: popupContent }}
            />
            <div className="popup-footer">
              <button
                className="close-button"
                onClick={() => setPopupContent('')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="product-detail-buttons">
        <button
          onClick={() => {
            addToCart(product);
            navigate('/cart');
          }}
        >
          Add to Cart
        </button>
        <button onClick={() => navigate('/')}>Back to Store</button>
      </div>
    </div>
  );
}

function CartSummary({ cart, setCart }) {
  const navigate = useNavigate();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const increaseQuantity = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart(
      cart.flatMap((item) => {
        if (item.id === id) {
          return item.quantity === 1 ? [] : { ...item, quantity: item.quantity - 1 };
        }
        return item;
      })
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePurchase = () => {
    setShowPurchaseModal(true);
    setTimeout(() => {
      setShowPurchaseModal(false);
      setCart([]);
      setShowPaymentOptions(false);
      setSelectedPayment('');
    }, 3000);
  };

  return (
    <div className="cart-summary">
      <h1>Your Cart</h1>
      {cart.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <button onClick={() => navigate('/')}>Back to Shopping</button>
        </div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img src={item.thumbnail} alt={item.title} width="60" />{' '}
                    {item.title}
                  </td>
                  <td>${item.price}</td>
                  <td>
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      style={{ backgroundColor: 'red', color: 'white', fontSize: '18px' }}
                    >
                      -
                    </button>
                    {item.quantity}
                    <button
                      onClick={() => increaseQuantity(item.id)}
                      style={{ backgroundColor: 'green', color: 'white', fontSize: '18px' }}
                    >
                      +
                    </button>
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button onClick={() => setCart(cart.filter((i) => i.id !== item.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Total: ${total.toFixed(2)}</h2>

          <button className="continue-btn" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
          <button
            className="checkout-btn"
            onClick={() => setShowPaymentOptions(!showPaymentOptions)}
          >
            Checkout
          </button>

          {showPaymentOptions && (
            <>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="payment-select"
              >
                <option value="">Select Payment Method</option>
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
                <option value="paypal">PayPal</option>
              </select>
              
              {selectedPayment && (
                <button 
                  className="buy-button"
                  onClick={handlePurchase}
                >
                  🛒 BUY NOW
                </button>
              )}
            </>
          )}
        </>
      )}

      {showPurchaseModal && (
        <div className="popup-overlay">
          <div className="enhanced-popup-window success-popup">
            <div className="popup-header">
              <div className="success-icon">✅</div>
              <h2>Purchase Successful!</h2>
            </div>
            <div className="popup-content">
              <p>Thank you for your purchase!</p>
              <p>Payment processed via {selectedPayment}</p>
              <p>Your order will be shipped soon.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginModal({ onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="enhanced-popup-window auth-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <div className="auth-icon">🔐</div>
          <h2>Welcome Back</h2>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <p>Sign in to your account</p>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="popup-footer">
          <button
            className="primary-button"
            onClick={() => onLogin(username, password)}
          >
            Sign In
          </button>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterModal({ onClose, onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="enhanced-popup-window auth-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <div className="auth-icon">👤</div>
          <h2>Create Account</h2>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <p>Join us today!</p>
          <div className="input-group">
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="popup-footer">
          <button
            className="primary-button"
            onClick={() => onRegister(username, password)}
          >
            Create Account
          </button>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomNotification({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-notification ${notification.type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {notification.type === 'success' ? '✅' : '❌'}
        </div>
        <div className="notification-message">
          {notification.message}
        </div>
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

export default App;