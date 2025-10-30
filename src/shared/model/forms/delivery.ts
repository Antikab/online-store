import { reactive, computed } from 'vue'

export interface DeliveryForm {
  fullName: string
  phone: string
  city: string
  address: string
  zip?: string
}

export function useDeliveryForm(initial?: Partial<DeliveryForm>) {
  const form = reactive<DeliveryForm>({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    zip: '',
    ...initial
  })

  const isValid = computed(
    () => !!form.fullName && !!form.city && !!form.address && /^\+?\d{10,15}$/.test(form.phone)
  )

  function reset(next?: Partial<DeliveryForm>) {
    form.fullName = next?.fullName ?? ''
    form.phone = next?.phone ?? ''
    form.city = next?.city ?? ''
    form.address = next?.address ?? ''
    form.zip = next?.zip ?? ''
  }

  return { form, isValid, reset }
}
