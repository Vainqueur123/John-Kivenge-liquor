import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
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
  )
}
