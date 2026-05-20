interface MeetingInput {
  subject: string
  startDateTime: string
  endDateTime: string
}

export async function createOnlineMeeting(accessToken: string, input: MeetingInput): Promise<string> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me/onlineMeetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: input.subject,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Teams meeting: ${error}`)
  }

  const meeting = await response.json()
  return meeting.joinUrl || meeting.joinWebUrl
}
