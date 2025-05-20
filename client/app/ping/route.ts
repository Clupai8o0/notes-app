export async function GET() {
  console.log(process.env.SERVER)
  const resp = await fetch(`http://server:5000/ping`)
  console.log(resp)

  return Response.json({ message: "hello there, how you doing?" })
}