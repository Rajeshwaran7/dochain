import { redirect } from 'next/navigation';

export default function DoctorHome() {
  redirect('/auth/login');
}
