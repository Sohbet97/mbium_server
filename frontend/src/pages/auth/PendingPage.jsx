import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, History, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthApi } from '@/lib/api'
import { toast } from 'sonner'

const STATUS = {
  0: { icon: Clock,        color: 'text-slate-400',  title: 'Dükan arzasy ýok',         desc: 'Dükan açmak üçin arzany dolduryň.' },
  1: { icon: Clock,        color: 'text-amber-500',  title: 'Arza garaşylýar',           desc: 'Moderator arzaňyzy gözden geçirýär. Bu birnäçe iş gününi alyp biler.' },
  2: { icon: CheckCircle,  color: 'text-green-500',  title: 'Tassyklanan',               desc: 'Dükanyňyz tassyklanan, ýöne heniz aktiwleşdirilmedik.' },
  3: { icon: XCircle,      color: 'text-red-500',    title: 'Ret edildi',                desc: 'Arza ret edildi. Aşakdaky sebäbi okaň we täzeden iberiň.' },
}

const ACTION_LABEL = {
  submitted: 'Iberildi',
  approved:  'Tassyklandy',
  rejected:  'Ret edildi',
  reopened:  'Täzeden açyldy',
  withdrawn: 'Yzyna alyndy',
}

export default function PendingPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const shop = user?.shop
  const vs = shop?.verification_status ?? 0
  const info = STATUS[vs] ?? STATUS[0]
  const Icon = info.icon

  const [withdrawing, setWithdrawing] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!shop) return
    AuthApi.getMyShopHistory()
      .then(({ data }) => setHistory(data.data ?? []))
      .catch(() => {})
  }, [shop])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleWithdraw() {
    if (!window.confirm('Arzany yzyna almak isleýäniňize ynanýarsyňyzmy?')) return
    setWithdrawing(true)
    try {
      const { data } = await AuthApi.withdrawShop()
      updateUser({ shop: data.model })
      toast.success('Arza yzyna alyndy')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk boldy. Gaýtadan synanyşyň.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#1a1f2e] dark:via-[#232727] dark:to-[#1f2937] px-4">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-600 bg-white dark:bg-[#0e0e0e] dark:text-white border hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Çykmak
      </button>

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

          {vs === 1 && (
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? 'Yzyna alynýar…' : 'Arzany yzyna al'}
            </Button>
          )}
        </div>

        {shop && history.length > 0 && (
          <div className="bg-white dark:bg-[#111114] rounded-2xl p-6 shadow-sm border dark:border-white/[0.06] text-left space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white">
              <History className="h-4 w-4 text-slate-400" />
              Arza taryhy
            </div>
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {history.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-200">
                      <span className="font-medium">{ACTION_LABEL[h.action] ?? h.action}</span>
                      {h.admin && <span className="text-slate-400"> · {h.admin.name} {h.admin.surname}</span>}
                    </p>
                    {h.note && <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
