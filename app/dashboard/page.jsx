import SubmissionDashboard from '../../components/SubmissionDashboard';

export const metadata = {
  title: 'Author Dashboard',
  description: 'Manage manuscript proposals and review your submission history.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <SubmissionDashboard />;
}