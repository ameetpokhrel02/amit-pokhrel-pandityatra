import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditProfile } from '@/components/profile/EditProfile'
import { AIPreferences } from '@/components/profile/AIPreferences'
import { TOTPSecuritySection } from '@/components/profile/TOTPSecuritySection'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const Profile = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const currentTab = new URLSearchParams(location.search).get('tab') || 'personal'

  return (
    <DashboardLayout userRole="user">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences.</p>
        </div>

        <Tabs 
            value={currentTab} 
            onValueChange={(val) => navigate(`/profile?tab=${val}`)} 
            className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="ai-preferences">AI Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="security">
            <TOTPSecuritySection />
          </TabsContent>
          
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Update your contact and demographic information.</CardDescription>
              </CardHeader>
              <CardContent>
                <EditProfile />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-preferences">
            <Card>
              <CardHeader>
                <CardTitle>AI Samagri Preferences</CardTitle>
                <CardDescription>Control what the recommender engine suggests for your pujas.</CardDescription>
              </CardHeader>
              <CardContent>
                <AIPreferences />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default Profile
