import { ChevronDown, MoreVertical } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"

interface HabitItemProps {
  title: string
  points: number
  status?: string
  streak?: number
}

const HabitItem = ({ title, points, status, streak }: HabitItemProps) => {
  return (
    <div className="flex items-center space-x-4 py-2">
      <div className="flex items-center space-x-2 flex-1">
        <Checkbox />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )}
        {streak && (
          <Badge variant="secondary" className="text-xs">
            🔥 {streak}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {points}
        </Badge>
      </div>
    </div>
  )
}

interface HabitGroupProps {
  title: string
  habits: HabitItemProps[]
}

const HabitGroup = ({ title, habits }: HabitGroupProps) => {
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full">
          <span>{title}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1">
          {habits.map((habit, index) => (
            <HabitItem key={index} {...habit} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export const HabitList = () => {
  const habitGroups = [
    {
      title: "Morning",
      habits: [
        { title: "Get out of the bed when awake", points: 5 },
        { title: "10 mins of workout", points: 3, streak: 2 },
        { title: "Oil pulling after brushing", points: 2 },
        { title: "No screen for first 1 hour of the day", points: 10, status: "Dead" },
        { title: "2 mins of yoga", points: 1 },
        { title: "Write a page about anything", points: 5, streak: 2 },
        { title: "10 mins of meditation", points: 10, status: "Weakening" },
        { title: "Review notes for 5 mins", points: 2 },
      ],
    },
    {
      title: "Workout",
      habits: [],
    },
    {
      title: "Mental",
      habits: [],
    },
    {
      title: "Night",
      habits: [],
    },
    {
      title: "Improve quality of life",
      habits: [],
    },
    {
      title: "Professional",
      habits: [],
    },
    {
      title: "Relationships",
      habits: [],
    },
  ]

  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-sm">
            Last 7 Days <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" className="text-sm">
            View Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-4">
          {habitGroups.map((group) => (
            <HabitGroup key={group.title} {...group} />
          ))}
        </Accordion>
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Add New Habit
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Add New Group
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}