import { useEffect, useState } from 'react';
import { fetchProducts } from './products';
import { createOrder } from './orders';
import { signUp, signIn, getCurrentUser } from './auth';
import { CartProvider, useCart } from './CartContext';

function ProductList() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      const { data } = await fetchProducts();
      setProducts(data || []);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {products.map(p => (
          <div key={p.id} style={{ border: '1px solid #ccc', padding: '1rem' }}>
            <h3>{p.name}</h3>
            <p>Price: {(p.price_cents / 100).toFixed(2)} RWF</p>
            <button onClick={() => addToCart(p)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cart() {
  const { cart, removeFromCart, total, clearCart } = useCart();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const current = await getCurrentUser();
      setUser(current.data);
    }
    loadUser();
  }, []);

  const handleCheckout = async () => {
    if (!user) return alert('You must log in to place an order');
    const orderData = {
      total,
      shipping: { street: '123 Main St', city: 'Kigali', country: 'Rwanda' },
      billing: { street: '123 Main St', city: 'Kigali', country: 'Rwanda' },
      notes: 'Order from Windsurf Demo',
    };
    const { data, error } = await createOrder(user.id, orderData);
    if (error) alert(error.message);
    else {
      alert('Order created successfully!');
      clearCart();
    }
  };

  return (
    <div>
      <h2>Cart</h2>
      {cart.length === 0 ? <p>Cart is empty</p> : null}
      {cart.map(item => (
        <div key={item.id}>
          {item.name} x {item.quantity} - {(item.price_cents * item.quantity / 100).toFixed(2)} RWF
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      <p>Total: {(total / 100).toFixed(2)} RWF</p>
      <button onClick={handleCheckout} disabled={cart.length === 0}>Checkout</button>
    </div>
  );
}

function AuthForm({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    const { data, error } = await signUp(email, password);
    if (error) alert(error.message);
    else {
      alert('Sign up successful!');
      onAuth(data.user);
    }
  };

  const handleSignIn = async () => {
    const { data, error } = await signIn(email, password);
    if (error) alert(error.message);
    else onAuth(data.user);
  };

  return (
    <div>
      <h2>Auth</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <CartProvider>
      <div style={{ padding: '2rem' }}>
        {!user ? <AuthForm onAuth={setUser} /> : <p>Welcome {user.email}</p>}
        <ProductList />
        <Cart />
      </div>
    </CartProvider>
  );
}
