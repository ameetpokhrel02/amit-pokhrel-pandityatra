import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditProfile } from '@/components/profile/EditProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Profile = () => {
  return (
    <DashboardLayout userRole="user">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EditProfile />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Profile
