import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Image, Save } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface HabitEditFormProps {
  habit: {
    id: number
    name: string
    points: number
    cover_image?: string | null
    multiple_per_day?: boolean
  }
}

export const HabitEditForm = ({ habit }: HabitEditFormProps) => {
  const [name, setName] = useState(habit.name)
  const [points, setPoints] = useState(habit.points)
  const [multiplePerDay, setMultiplePerDay] = useState(habit.multiple_per_day || false)
  const [searchQuery, setSearchQuery] = useState("")
  const [unsplashImages, setUnsplashImages] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (values: { name: string; points: number; cover_image?: string; multiple_per_day: boolean }) => {
      const { error } = await supabase
        .from('habits')
        .update(values)
        .eq('id', habit.id)

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
        cover_image: imageUrl,
        multiple_per_day: multiplePerDay
      })
      setShowImageDialog(false)
    } catch (error) {
      console.error('Error setting cover image:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Habit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {habit.cover_image && (
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

        <div className="flex items-center space-x-2">
          <Switch
            id="multiple-per-day"
            checked={multiplePerDay}
            onCheckedChange={setMultiplePerDay}
          />
          <Label htmlFor="multiple-per-day">Allow multiple completions per day</Label>
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

        <Button
          onClick={() => updateMutation.mutate({ 
            name, 
            points, 
            multiple_per_day: multiplePerDay 
          })}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
}