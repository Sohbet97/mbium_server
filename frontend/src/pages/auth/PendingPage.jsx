import { useAuth } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STATUS = {
  0: { icon: Clock,        color: 'text-slate-400',  title: 'Dükan arzasy ýok',         desc: 'Dükan açmak üçin arzany dolduryň.' },
  1: { icon: Clock,        color: 'text-amber-500',  title: 'Arza garaşylýar',           desc: 'Moderator arzaňyzy gözden geçirýär. Bu birnäçe iş gününi alyp biler.' },
  2: { icon: CheckCircle,  color: 'text-green-500',  title: 'Tassyklanan',               desc: 'Dükanyňyz tassyklanan, ýöne heniz aktiwleşdirilmedik.' },
  3: { icon: XCircle,      color: 'text-red-500',    title: 'Ret edildi',                desc: 'Arza ret edildi. Aşakdaky sebäbi okaň we täzeden iberiň.' },
}

export default function PendingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const shop = user?.shop
  const vs = shop?.verification_status ?? 0
  const info = STATUS[vs] ?? STATUS[0]
  const Icon = info.icon

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#1a1f2e] dark:via-[#232727] dark:to-[#1f2937] px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">mbium</span>

        <div className="bg-white dark:bg-[#111114] rounded-2xl p-8 shadow-sm border dark:border-white/[0.06] space-y-4">
          <Icon className={`h-12 w-12 mx-auto ${info.color}`} />
          <h2 className="text-lg font-semibold dark:text-white">{info.title}</h2>
          <p className="text-sm text-slate-500">{info.desc}</p>

          {shop?.verification_note && vs === 3 && (
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400 text-left">
              <span className="font-medium">Sebäp:</span> {shop.verification_note}
            </div>
          )}

          {(vs === 0 || vs === 3) && (
            <Button className="w-full" onClick={() => navigate('/apply')}>
              {vs === 3 ? 'Täzeden iber' : 'Dükan aç'}
            </Button>
          )}
        </div>

        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">
          Çykmak
        </button>
      </div>
    </div>
  )
}
