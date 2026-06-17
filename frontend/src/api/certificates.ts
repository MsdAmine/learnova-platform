import api from './axios';

export interface CertificateResponse {
  id: number;
  certificateCode: string;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  learnerName: string;
  issuedAt: string;
}

export async function getMyCertificates(): Promise<CertificateResponse[]> {
  const { data } = await api.get<CertificateResponse[]>('/api/v1/learner/certificates');
  return data;
}

export async function issueCertificate(courseId: number): Promise<CertificateResponse> {
  const { data } = await api.post<CertificateResponse>(
    `/api/v1/learner/certificates/course/${courseId}/issue`,
  );
  return data;
}

export async function getCertificate(certificateId: number): Promise<CertificateResponse> {
  const { data } = await api.get<CertificateResponse>(
    `/api/v1/learner/certificates/${certificateId}`,
  );
  return data;
}
