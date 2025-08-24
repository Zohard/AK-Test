<template>
  <div class="main-content max-w-3xl">
    <h1 class="section-title mb-4">Créer une fiche business</h1>

    <form class="card p-5 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm mb-1">Dénomination *</label>
        <input v-model="form.denomination" class="form-input w-full" required />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Type</label>
          <input v-model="form.type" class="form-input w-full" placeholder="Studio, Éditeur, ..." />
        </div>
        <div>
          <label class="block text-sm mb-1">Origine</label>
          <input v-model="form.origine" class="form-input w-full" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Site officiel</label>
          <input v-model="form.siteOfficiel" class="form-input w-full" placeholder="https://..." />
        </div>
        <div>
          <label class="block text-sm mb-1">Date</label>
          <input v-model="form.date" class="form-input w-full" placeholder="Libre (ex: 1998)" />
        </div>
      </div>
      <div>
        <label class="block text-sm mb-1">Notes</label>
        <textarea v-model="form.notes" rows="4" class="form-input w-full" />
      </div>
      <div class="grid grid-cols-1 md-grid-cols-2 gap-4 items-end">
        <div>
          <label class="block text-sm mb-1">Statut</label>
          <select v-model.number="form.statut" class="form-input w-full">
            <option :value="1">Actif</option>
            <option :value="0">Inactif</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Image (upload)</label>
          <input type="file" accept="image/*" @change="onFile" />
          <div v-if="form.image" class="text-xs text-gray-500 mt-1">Fichier: {{ form.image }}</div>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" class="btn-primary">Créer</button>
        <NuxtLink to="/admin/business" class="btn-secondary">Annuler</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const router = useRouter()
const auth = useAuthStore()

const form = reactive<any>({ denomination: '', statut: 1 })

const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'cover')
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', body: fd, headers: auth.getAuthHeaders() as any
    })
    form.image = res.filename
  } catch (err) {
    console.error('Upload error', err)
    alert('Échec de l\'upload')
  }
}

const submit = async () => {
  try {
    await $fetch(`${config.public.apiBase}/api/admin/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
      body: form
    })
    router.push('/admin/business')
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || 'Erreur lors de la création')
  }
}
</script>

<style scoped>
.btn-primary { background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
</style>

