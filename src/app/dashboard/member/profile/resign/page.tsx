import { redirect } from 'next/navigation'

export default function ResignRedirectPage() {
  redirect('/dashboard/member/resignations')
}
