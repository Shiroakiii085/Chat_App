'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore(state => state.login);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.accessToken, data.refreshToken);
        router.push('/');
      } else {
        alert('Registration failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleRegister} className="flex flex-col gap-4 p-8 bg-white rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Register Devine</h1>
        <Input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <Input 
          type="text" 
          placeholder="Display Name" 
          value={displayName} 
          onChange={e => setDisplayName(e.target.value)} 
          required 
        />
        <Input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <Button type="submit">Register</Button>
        <Button variant="outline" type="button" onClick={() => router.push('/login')}>Back to Login</Button>
      </form>
    </div>
  );
}
