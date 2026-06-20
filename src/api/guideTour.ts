import api from '@/api'

type GuideTourPayload = {
    home?: boolean;
    wardrobe?: boolean;
    feed?: boolean;
    mypage?: boolean;
};

export async function updateGuideTour(payload: GuideTourPayload): Promise<void> {
    await api.patch('/api/v1/users/guide-tour', payload)
}