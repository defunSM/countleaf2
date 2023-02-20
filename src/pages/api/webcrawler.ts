// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

// fetch html from the link
async function getHTML(link: any) {
  const response = await fetch(link)
  const html = await response.text()
  return html
}

export default async function handler(
  req: NextApiRequest,
  res: any
) {
  const { link } = req.query
  const html = await getHTML(link)
  res.status(200).json(html)
}
