'use client';

import { Shield, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export interface LoginScreenProps {
  adminSetupMode: boolean;
  adminSetupEmail: string;
  setAdminSetupEmail: (v: string) => void;
  adminSetupPassword: string;
  setAdminSetupPassword: (v: string) => void;
  handleAdminSetup: () => void;
  employeeLoginId: string;
  setEmployeeLoginId: (v: string) => void;
  employeeLoginPass: string;
  setEmployeeLoginPass: (v: string) => void;
  handleEmployeeLogin: () => void;
  adminPassword: string;
  setAdminPassword: (v: string) => void;
  handleAdminLogin: () => void;
  roleLoading: boolean;
}

export function LoginScreen({
  adminSetupMode, adminSetupEmail, setAdminSetupEmail, adminSetupPassword, setAdminSetupPassword,
  handleAdminSetup, employeeLoginId, setEmployeeLoginId, employeeLoginPass, setEmployeeLoginPass,
  handleEmployeeLogin, adminPassword, setAdminPassword, handleAdminLogin, roleLoading,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trishul AI Helper</h1>
          <p className="text-sm text-muted-foreground">Your AI-powered Code Knowledge Base</p>
        </div>
        {adminSetupMode && (
          <Card className="mb-4"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-amber-500"/>Setup Administrator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Admin Email *</Label><Input value={adminSetupEmail} onChange={e=>setAdminSetupEmail(e.target.value)} placeholder="admin@example.com" type="email" /></div>
            <div><Label>Password *</Label><Input value={adminSetupPassword} onChange={e=>setAdminSetupPassword(e.target.value)} placeholder="Create a strong password" type="password" onKeyDown={e=>e.key==='Enter'&&handleAdminSetup()} /></div>
            <Button onClick={handleAdminSetup} disabled={roleLoading||!adminSetupEmail.trim()||!adminSetupPassword.trim()} className="w-full">
              {roleLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<Shield className="h-4 w-4 mr-2"/>}Create Admin Account
            </Button>
          </CardContent></Card>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-5 w-5 text-emerald-500"/>Employee</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input value={employeeLoginId} onChange={e=>setEmployeeLoginId(e.target.value)} placeholder="Employee ID" onKeyDown={e=>e.key==='Enter'&&handleEmployeeLogin()} />
              <Input value={employeeLoginPass} onChange={e=>setEmployeeLoginPass(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==='Enter'&&handleEmployeeLogin()} />
              <Button onClick={handleEmployeeLogin} disabled={roleLoading||!employeeLoginId.trim()||!employeeLoginPass.trim()} className="w-full" variant="default">
                {roleLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<User className="h-4 w-4 mr-2"/>}Login
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-amber-500"/>Administrator</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Admin Password" type="password" onKeyDown={e=>e.key==='Enter'&&handleAdminLogin()} />
              <Button onClick={handleAdminLogin} disabled={roleLoading||!adminPassword.trim()} className="w-full">
                {roleLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<Shield className="h-4 w-4 mr-2"/>}Login as Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
