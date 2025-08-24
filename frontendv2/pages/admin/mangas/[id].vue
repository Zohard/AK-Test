<template>
  <div class="main-content max-w-4xl" v-if="manga">
    <h1 class="section-title mb-4">Éditer le manga #{{ manga.idManga }}</h1>

    <form class="card p-5 space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-sm mb-1">Titre</label>
        <input v-model="manga.titre" class="form-input w-full" required />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Auteur</label>
          <input v-model="manga.auteur" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Année (AAAA)</label>
          <input v-model="manga.annee" maxlength="4" class="form-input w-full" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Éditeur</label>
          <input v-model="manga.editeur" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Nb Volumes (numérique)</label>
          <input v-model.number="manga.nbVol" type="number" min="0" class="form-input w-full" />
        </div>
      </div>
      <div>
        <label class="block text-sm mb-1">Synopsis</label>
        <textarea v-model="manga.synopsis" rows="4" class="form-input w-full" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label class="block text-sm mb-1">Statut</label>
          <select v-model.number="manga.statut" class="form-input w-full">
            <option :value="0">Brouillon</option>
            <option :value="1">Publié</option>
            <option :value="2">Refusé</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Image (upload)</label>
          <input type="file" accept="image/*" @change="onFile" />
          <div v-if="manga.image" class="text-xs text-gray-500 mt-1">Fichier: {{ manga.image }}</div>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="submit" class="btn-primary">Enregistrer</button>
        <NuxtLink to="/admin/mangas" class="btn-secondary">Retour</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()

const manga = ref<any>(null)

const load = async () => {
  const res = await $fetch(`${config.public.apiBase}/api/admin/mangas/${route.params.id}`, {
    headers: auth.getAuthHeaders() as any
  })
  manga.value = res
}

const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'manga')
  fd.append('relatedId', String(manga.value.idManga))
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', body: fd, headers: auth.getAuthHeaders() as any
    })
    manga.value.image = res.filename
  } catch (err) {
    console.error('Upload error', err)
    alert('Échec de l\'upload')
  }
}

const save = async () => {
  try {
    const body: any = {
      titre: manga.value.titre,
      auteur: manga.value.auteur,
      annee: manga.value.annee,
      nbVol: manga.value.nbVol,
      editeur: manga.value.editeur,
      synopsis: manga.value.synopsis,
      image: manga.value.image,
      statut: manga.value.statut,
    }
    await $fetch(`${config.public.apiBase}/api/admin/mangas/${manga.value.idManga}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
      body
    })
    alert('Enregistré')
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || 'Erreur lors de l\'enregistrement')
  }
}

onMounted(load)

// Admin content helpers
const type = 'manga'
const relations = ref<any[]>([])
const staff = ref<any[]>([])
const tags = ref<any[]>([])

const loadAdminExtras = async () => {
  const [rels, stf, tgs] = await Promise.all([
    $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/relationships`, { headers: auth.getAuthHeaders() as any }),
    $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/staff`, { headers: auth.getAuthHeaders() as any }),
    $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/tags`, { headers: auth.getAuthHeaders() as any }),
  ])
  relations.value = rels as any[]
  staff.value = stf as any[]
  tags.value = tgs as any[]
}

watch(manga, (v) => { if (v) loadAdminExtras() })

// Relations
const relForm = reactive<any>({ related_type: 'anime', related_id: undefined, relation_type: 'related' })
const addRelation = async () => {
  if (!relForm.related_id) return
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/relationships`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, body: relForm
  })
  relForm.related_id = undefined
  await loadAdminExtras()
}
const deleteRelation = async (rel: any) => {
  await $fetch(`${config.public.apiBase}/api/admin/content/relationships/${rel.id_relation}`, {
    method: 'DELETE', headers: auth.getAuthHeaders() as any
  })
  await loadAdminExtras()
}

// Staff
const businessQuery = ref('')
const businessOptions = ref<any[]>([])
const staffForm = reactive<any>({ businessId: undefined, role: '' })
const debouncedSearchBusiness = useDebounceFn(async () => {
  if (!businessQuery.value) { businessOptions.value = []; return }
  const res: any = await $fetch(`${config.public.apiBase}/api/admin/business`, {
    params: { search: businessQuery.value, page: 1, limit: 10 }, headers: auth.getAuthHeaders() as any
  })
  businessOptions.value = res.items || []
}, 400)
const selectBusiness = (b: any) => { staffForm.businessId = b.idBusiness }
const addStaff = async () => {
  if (!staffForm.businessId) return
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/staff`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, body: staffForm
  })
  staffForm.businessId = undefined
  await loadAdminExtras()
}
const removeStaff = async (s: any) => {
  const id = s.id_business || s.idBusiness
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/staff/${id}`, {
    method: 'DELETE', headers: auth.getAuthHeaders() as any
  })
  await loadAdminExtras()
}

// Tags
const tagForm = reactive<any>({ tagId: undefined })
const tagSearch = ref('')
const tagOptions = ref<any[]>([])
const debouncedSearchTags = useDebounceFn(async () => {
  if (!tagSearch.value) { tagOptions.value = []; return }
  const res: any = await $fetch(`${config.public.apiBase}/api/admin/content/tags/search`, {
    params: { q: tagSearch.value, limit: 10 }, headers: auth.getAuthHeaders() as any
  })
  const attachedIds = new Set(tags.value.map((t: any) => t.id))
  tagOptions.value = (res.items || []).filter((opt: any) => !attachedIds.has(opt.id))
}, 300)
const selectTag = (opt: any) => { tagForm.tagId = opt.id }
const addTag = async () => {
  if (!tagForm.tagId) return
  if (tags.value.some((t: any) => t.id === tagForm.tagId)) {
    alert('Ce tag est déjà associé')
    return
  }
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/tags`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, body: tagForm
  })
  tagForm.tagId = undefined
  await loadAdminExtras()
}
const removeTag = async (t: any) => {
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/tags/${t.id}`, {
    method: 'DELETE', headers: auth.getAuthHeaders() as any
  })
  await loadAdminExtras()
}
</script>

<style scoped>
.btn-primary { background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
.btn-x { margin-left: 8px; background: transparent; color: #6b7280; }
.chip { padding: 2px 8px; border-radius: 9999px; background: #f3f4f6; font-size: 12px; }
.btn-small { background: #e5e7eb; color: #111827; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
.btn-small.danger { background: #fee2e2; color: #991b1b; }
.btn-x { margin-left: 8px; background: transparent; color: #6b7280; }
.chip { padding: 2px 8px; border-radius: 9999px; background: #f3f4f6; font-size: 12px; }
</style>
