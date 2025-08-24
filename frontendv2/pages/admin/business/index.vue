<template>
  <div class="main-content">
    <div class="section-header">
      <h1 class="section-title">Admin · Business</h1>
    </div>

    <div class="card p-4 mb-4 flex gap-3 items-end">
      <div>
        <label class="block text-sm mb-1">Recherche</label>
        <input v-model="filters.search" class="form-input" placeholder="Dénomination..." @keyup.enter="load" />
      </div>
      <div>
        <label class="block text-sm mb-1">Type</label>
        <input v-model="filters.type" class="form-input" />
      </div>
      <div>
        <label class="block text-sm mb-1">Statut</label>
        <select v-model.number="filters.statut" class="form-input w-40">
          <option :value="undefined">Tous</option>
          <option :value="0">Inactif</option>
          <option :value="1">Actif</option>
        </select>
      </div>
      <button class="btn-secondary" @click="load">Appliquer</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Dénomination</th>
            <th>Type</th>
            <th>Origine</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in items" :key="b.idBusiness">
            <td>{{ b.idBusiness }}</td>
            <td>{{ b.denomination }}</td>
            <td>{{ b.type || '—' }}</td>
            <td>{{ b.origine || '—' }}</td>
            <td>
              <span :class="['chip', b.statut === 1 ? 'chip-green' : 'chip-gray']">
                {{ b.statut === 1 ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="flex gap-2">
              <button class="btn-small" @click="toggleStatus(b)">
                {{ b.statut === 1 ? 'Désactiver' : 'Activer' }}
              </button>
              <button class="btn-small danger" @click="remove(b)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center gap-3">
      <button class="btn-secondary" :disabled="page<=1" @click="page--; load()">Précédent</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button class="btn-secondary" :disabled="page>=totalPages" @click="page++; load()">Suivant</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const auth = useAuthStore()

const items = ref<any[]>([])
const page = ref(1)
const limit = ref(20)
const totalPages = ref(1)

const filters = reactive<{ search?: string; type?: string; statut?: number | undefined }>({})

const load = async () => {
  const params: any = { page: page.value, limit: limit.value, ...filters }
  const res = await $fetch(`${config.public.apiBase}/api/admin/business`, {
    params,
    headers: auth.getAuthHeaders() as any
  })
  items.value = (res as any).items || []
  const p = (res as any).pagination || {}
  totalPages.value = p.totalPages || 1
}

onMounted(load)

const toggleStatus = async (b: any) => {
  const newStatus = b.statut === 1 ? 0 : 1
  await $fetch(`${config.public.apiBase}/api/admin/business/${b.idBusiness}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
    body: { statut: newStatus }
  })
  await load()
}

const remove = async (b: any) => {
  if (!confirm(`Supprimer "${b.denomination}" ?`)) return
  await $fetch(`${config.public.apiBase}/api/admin/business/${b.idBusiness}`, {
    method: 'DELETE',
    headers: auth.getAuthHeaders() as any
  })
  await load()
}
</script>

<style scoped>
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
.chip { padding: 2px 8px; border-radius: 9999px; font-size: 12px; }
.chip-green { background: #dcfce7; color: #166534; }
.chip-gray { background: #f3f4f6; color: #374151; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.btn-small { background: #e5e7eb; color: #111827; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
.btn-small.danger { background: #fee2e2; color: #991b1b; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
</style>
