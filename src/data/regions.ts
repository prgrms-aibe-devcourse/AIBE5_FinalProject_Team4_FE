import type { RegionCode } from '@/types/index';

export const REGIONS: { code: RegionCode; label: string }[] = [
    { code: 'SEOUL', label: '서울특별시' },
    { code: 'BUSAN', label: '부산광역시' },
    { code: 'DAEGU', label: '대구광역시' },
    { code: 'INCHEON', label: '인천광역시' },
    { code: 'GWANGJU', label: '광주광역시' },
    { code: 'DAEJEON', label: '대전광역시' },
    { code: 'ULSAN', label: '울산광역시' },
    { code: 'SEJONG', label: '세종특별자치시' },
    { code: 'GYEONGGI', label: '경기도' },
    { code: 'GANGWON', label: '강원특별자치도' },
    { code: 'CHUNGBUK', label: '충청북도' },
    { code: 'CHUNGNAM', label: '충청남도' },
    { code: 'JEONBUK', label: '전라북도' },
    { code: 'JEONNAM', label: '전라남도' },
    { code: 'GYEONGBUK', label: '경상북도' },
    { code: 'GYEONGNAM', label: '경상남도' },
    { code: 'JEJU', label: '제주특별자치도' },
]