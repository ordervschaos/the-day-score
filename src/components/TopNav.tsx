import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, BarChart, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/UserMenu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"

const getBreadcrumbItems = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean)
  const items = []

  if (parts.length === 0) {
    return [{ label: 'Dashboard', path: '/', current: true }]
  }

  items.push({ label: 'Dashboard', path: '/', current: false })

  parts.forEach((part, index) => {
    const path = `/${parts.slice(0, index + 1).join('/')}`
    let label = part.charAt(0).toUpperCase() + part.slice(1)
    
    // Handle special cases
    if (part === 'habits' && parts[index + 1]) {
      label = 'Habit Details'
    }
    
    items.push({
      label,
      path,
      current: index === parts.length - 1
    })
  })

  return items
}

export const TopNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const breadcrumbItems = getBreadcrumbItems(location.pathname)
  const showBackButton = location.pathname !== '/'

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    getUser()
  }, [])

  const getUserInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }

  return (
    <header className="border-b">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <BreadcrumbItem key={item.path}>
                    {!item.current ? (
                      <>
                        <BreadcrumbLink asChild>
                          <Link to={item.path}>{item.label}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/analytics">
                <BarChart className="h-5 w-5" />
              </Link>
            </Button>
            {user && (
              <Avatar>
                <AvatarFallback>
                  {getUserInitials(user.email)}
                </AvatarFallback>
              </Avatar>
            )}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}