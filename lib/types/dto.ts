export interface UserDto {
  id: string
  name: string
  email: string
  role?: string
}

export interface AttendeeDto {
  id: string
  userId: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  isMandatory: boolean
  user: UserDto
}

export interface TimeSlotDto {
  id: string
  date: string
  startTime: string
  endTime: string
  teamsLink: string | null
}

export interface AppointmentFileDto {
  id: string
  fileName: string
  fileType: string
  fileData: string
  fileSize: number
  createdAt: string
}

export interface AppointmentDetailDto {
  id: string
  status: string
  meetingType: string
  date: string
  startTime: string
  endTime: string
  title: string | null
  description: string | null
  teamsLink: string | null
  teamsSyncStatus: string
  teamsSyncRetries: number
  teamsSyncError: string | null
  teamsSyncLastAttempt: string | null
  requestedAt: string
  updatedAt: string
  organizer: UserDto
  student: UserDto
  faculty: UserDto
  attendees: AttendeeDto[]
  timeSlots: TimeSlotDto[]
  actionTaken: string | null
  files: AppointmentFileDto[]
}
