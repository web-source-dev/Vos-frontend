'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

interface AuthPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: any) => void
  prefillEmail: string
  userExists?: boolean
}

export default function AuthPopup({ isOpen, onClose, onSuccess, prefillEmail, userExists = false }: AuthPopupProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: prefillEmail,
    password: '',
    confirmPassword: ''
  })
  const { login, signup } = useAuth()

  if (!isOpen) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required')
      return false
    }

    if (!isLogin) {
      if (!formData.firstName || !formData.lastName) {
        toast.error('First name and last name are required')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      if (isLogin) {
        // Use login from auth context
        const result = await login(formData.email, formData.password)
        if (result.success) {
          toast.success('Logged in successfully!')
          onSuccess({ email: formData.email })
        } else {
          toast.error('Login failed. Please check your credentials.')
        }
      } else {
        // Use signup from auth context
        const result = await signup({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: 'customer'
        })
        if (result.success) {
          toast.success('Account created successfully!')
          onSuccess({ email: formData.email })
        } else {
          toast.error('Registration failed. Please try again.')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || `${isLogin ? 'Login' : 'Registration'} failed`)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setFormData(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: ''
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle className="text-2xl font-bold text-center">
            {userExists ? 'Welcome Back!' : (isLogin ? 'Welcome Back!' : 'Create Account')}
          </CardTitle>
          <p className="text-gray-600 text-center">
            {userExists 
              ? 'We found your account. Please sign in to continue with your vehicle sale.'
              : (isLogin 
                ? 'Sign in to continue with your vehicle sale' 
                : 'Create an account to complete your vehicle sale'
              )
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 bg-gray-100"
                placeholder="Email address"
                disabled
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This email is already associated with your vehicle submission
              </p>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black font-semibold py-2"
            >
              {loading 
                ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          {!userExists && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-2 text-green-600 hover:text-green-700 font-medium"
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </p>
            </div>
          )}

          {userExists && isLogin && (
            <div className="mt-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  ✓ We found your account with this email address. Please sign in to continue.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}