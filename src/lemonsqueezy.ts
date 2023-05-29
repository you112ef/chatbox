import { ofetch } from 'ofetch'

type ActivateResponse =
    | {
        activated: true
        instance: { id: string }
        meta: {
            product_id: number
        }
    }
    | { activated: false; error: string }

export async function activateLicense(key: string, instanceName: string) {
    const resp = await ofetch<ActivateResponse>('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        body: {
            license_key: key,
            instance_name: instanceName,
        },
    })
    if (!resp.activated) {
        throw new Error(resp.error)
    }
    if (resp.meta.product_id !== 75903) {
        throw new Error('Unmatching product')
    }
    return resp.instance.id
}

export async function deactivateLicense(key: string, instanceId: string) {
    await ofetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
        method: 'POST',
        body: {
            license_key: key,
            instance_id: instanceId,
        },
    })
}

type ValidateLicenseKeyResponse = {
    valid: boolean
}

export async function validateLicense(key: string, instanceId: string): Promise<ValidateLicenseKeyResponse> {
    const resp = await ofetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        body: {
            license_key: key,
            instance_id: instanceId,
        },
    })
    return { valid: resp.valid }
}
