import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Save, Trash, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TopNav } from "@/components/TopNav"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const HabitDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [name, setName] = useState("")
  const [points, setPoints] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [unsplashImages, setUnsplashImages] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  
  const { data: habit, isLoading } = useQuery({
    queryKey: ['habits', Number(id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', Number(id))
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Update local state when habit data is loaded
  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setPoints(habit.points)
    }
  }, [habit])

  const updateMutation = useMutation({
    mutationFn: async (values: { name: string; points: number; cover_image?: string }) => {
      const { error } = await supabase
        .from('habits')
        .update(values)
        .eq('id', Number(id))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success",
        description: "Habit updated successfully",
      })
    },
    onError: (error) => {
      console.error('Error updating habit:', error)
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive"
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', Number(id))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success",
        description: "Habit archived successfully",
      })
      navigate('/')
    },
    onError: (error) => {
      console.error('Error archiving habit:', error)
      toast({
        title: "Error",
        description: "Failed to archive habit",
        variant: "destructive"
      })
    }
  })

  const searchUnsplash = async (query: string, page: number = 1) => {
    setIsSearching(true)
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-search', {
        body: { query, page }
      })
      
      if (error) throw error
      setUnsplashImages(data.results)
      setTotalPages(data.total_pages)
    } catch (error) {
      console.error('Error searching Unsplash:', error)
      toast({
        title: "Error",
        description: "Failed to search for images",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    searchUnsplash(searchQuery, page)
  }

  const selectCoverImage = async (imageUrl: string) => {
    try {
      await updateMutation.mutateAsync({ 
        name, 
        points, 
        cover_image: imageUrl 
      })
      setShowImageDialog(false)
    } catch (error) {
      console.error('Error setting cover image:', error)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container max-w-2xl py-4">
        <Card>
          <CardHeader>
            <CardTitle>Habit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habit?.cover_image && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                <img 
                  src={habit.cover_image} 
                  alt={habit.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
              />
            </div>

            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Image className="w-4 h-4 mr-2" />
                  Change Cover Image
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Choose Cover Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search for images..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setCurrentPage(1)
                          searchUnsplash(searchQuery, 1)
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        setCurrentPage(1)
                        searchUnsplash(searchQuery, 1)
                      }}
                      disabled={isSearching}
                    >
                      Search
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 gap-4">
                      {unsplashImages.map((image: any) => (
                        <div 
                          key={image.id}
                          className="relative cursor-pointer group"
                          onClick={() => selectCoverImage(image.urls.regular)}
                        >
                          <img
                            src={image.urls.small}
                            alt={image.alt_description}
                            className="w-full h-40 object-cover rounded-lg transition-opacity group-hover:opacity-75"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary">Select</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {unsplashImages.length > 0 && totalPages > 1 && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => handlePageChange(currentPage - 1)}
                                className={currentPage === 1 || isSearching ? 'pointer-events-none opacity-50' : ''}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNumber = i + 1
                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    onClick={() => handlePageChange(pageNumber)}
                                    isActive={currentPage === pageNumber}
                                    className={isSearching ? 'pointer-events-none opacity-50' : ''}
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={currentPage === totalPages || isSearching ? 'pointer-events-none opacity-50' : ''}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Archive Habit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive the habit. You can restore it later from the archived habits section.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={() => updateMutation.mutate({ name, points })}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default HabitDetails
