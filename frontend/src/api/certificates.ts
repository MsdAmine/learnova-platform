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

export async function downloadCertificatePdf(
  certificateId: number,
  certificateCode: string,
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/api/v1/learner/certificates/${certificateId}/pdf`,
    { responseType: 'blob' },
  );

  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `learnova-certificate-${certificateCode}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
