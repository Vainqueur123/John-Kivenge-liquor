import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              John Kivenge Liquor Stock
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Premium liquor collection delivered to your door
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                Shop Now
              </Link>
              <button className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We offer the finest selection of premium liquors with exceptional service and delivery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Ordering</h3>
              <p className="text-gray-600">
                Simple and intuitive ordering process with multiple payment options
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Service</h3>
              <p className="text-gray-600">
                Expert staff ready to help you find the perfect selection
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Curated Collection</h3>
              <p className="text-gray-600">
                Hand-picked selection of the finest spirits from around the world
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600">
              Explore our wide range of premium liquors
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Whiskey', image: '🥃', slug: 'whiskey' },
              { name: 'Vodka', image: '🍾', slug: 'vodka' },
              { name: 'Rum', image: '🍹', slug: 'rum' },
              { name: 'Gin', image: '🧊', slug: 'gin' },
              { name: 'Brandy', image: '🥂', slug: 'brandy' },
              { name: 'Liqueurs', image: '🍸', slug: 'liqueurs' },
              { name: 'Beer', image: '🍺', slug: 'beer' },
              { name: 'Wine', image: '🍷', slug: 'wine' },
            ].map((category) => (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className="group bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors"
              >
                <div className="text-4xl mb-3">{category.image}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-500 to-yellow-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg text-black mb-8">
            Join thousands of satisfied customers who trust John Kivenge Liquor Stock
          </p>
          <Link
            to="/products"
            className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">John Kivenge Liquor</h3>
              <p className="text-gray-400">
                Premium liquor collection delivered to your door
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products" className="hover:text-white">Products</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/shipping" className="hover:text-white">Shipping</Link></li>
                <li><Link to="/returns" className="hover:text-white">Returns</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Phone: +250 788 123 456</li>
                <li>Email: info@johnkivenge.rw</li>
                <li>Kigali, Rwanda</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 John Kivenge Liquor Stock. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
