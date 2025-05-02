export default async function handler(req, res) {
  return res.status(200).json({ message: "Marble match endpoint is live!" });
}
