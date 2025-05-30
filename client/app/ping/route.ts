export async function GET() {
  const server = process.env.NEXT_PUBLIC_API_URL;
  console.log(server)
  const resp = await fetch(`${server}/ping`)
  const data = await resp.json()
  console.log(resp)

  return Response.json({ message: `Ping received from ${server} with message ${data.msg}` })
}