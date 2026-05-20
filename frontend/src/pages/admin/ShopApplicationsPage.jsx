import { useEffect, useState, useCallback } from 'react'
import { AdminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle, XCircle, FileText, Building2 } from 'lucide-react'

function KycLink({ label, url }) {
  if (!url) return <span className="text-slate-400 text-xs">{label}: —</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
      <FileText className="h-3 w-3" />{label}
    </a>
  )
}

export default function ShopApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [count, setCount]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [rejectModal, setRejectModal]   = useState(null) // shop object
  const [rejectNote, setRejectNote]     = useState('')
  const [processing, setProcessing]     = useState(null) // shop id

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.shopApplications.getAll({ limit: 50 })
      setApplications(data.data ?? [])
      setCount(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  async function handleVerify(shop) {
    setProcessing(shop.id)
    try {
      await AdminApi.shopApplications.verify(shop.id)
      toast.success(`"${shop.name}" tassyklandy`)
      setApplications((prev) => prev.filter((s) => s.id !== shop.id))
      setCount((c) => c - 1)
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setProcessing(null)
    }
  }

  function openReject(shop) {
    setRejectNote('')
    setRejectModal(shop)
  }

  async function handleReject() {
    if (!rejectModal) return
    setProcessing(rejectModal.id)
    try {
      await AdminApi.shopApplications.reject(rejectModal.id, { note: rejectNote || undefined })
      toast.success(`"${rejectModal.name}" ret edildi`)
      setApplications((prev) => prev.filter((s) => s.id !== rejectModal.id))
      setCount((c) => c - 1)
      setRejectModal(null)
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setProcessing(null)
    }
  }

  const tierCandidate = (shop) => !!(shop.patent_file && shop.bank_iban)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dark:text-white">Dükan arzalary</h1>
          <p className="text-sm text-slate-500">{count} garaşylýan arza</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchApplications}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !applications.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building2 className="h-12 w-12 mb-3 text-slate-200" />
            <p className="text-sm">Garaşylýan arza ýok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((shop) => (
            <Card key={shop.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Shop info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold dark:text-white">{shop.name}</span>
                      {tierCandidate(shop) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                          Verified PRO candidate
                        </span>
                      )}
                    </div>
                    {shop.owner && (
                      <p className="text-sm text-slate-500">
                        {shop.owner.name} {shop.owner.surname}
                        {shop.owner.phone_number && ` · ${shop.owner.phone_number}`}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      Ugradyldy: {new Date(shop.createdAt).toLocaleDateString()}
                    </p>

                    {/* KYC documents */}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <KycLink label="Passport" url={shop.passport_file} />
                      <KycLink label="Patent"   url={shop.patent_file} />
                      <KycLink label="Video"    url={shop.video_url} />
                      {shop.bank_iban && (
                        <span className="text-xs text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800 dark:text-slate-300">
                          {shop.bank_iban}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={processing === shop.id}
                      onClick={() => openReject(shop)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />Ret et
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={processing === shop.id}
                      onClick={() => handleVerify(shop)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />Tassykla
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arzany ret etmek — {rejectModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Ret etmegiň sebäbini giriziň (islege görä):</p>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Sebäp..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>Ýatyr</Button>
            <Button
              variant="destructive"
              disabled={processing === rejectModal?.id}
              onClick={handleReject}
            >
              {processing === rejectModal?.id ? 'Ugradylýar…' : 'Ret et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
