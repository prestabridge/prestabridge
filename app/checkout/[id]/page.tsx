import { redirect } from 'next/navigation'

export default async function LegacyCheckoutPage() {
  redirect('/dashboard/configurator')
}
