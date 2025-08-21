const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApprovalStatusUpdate {
  status: 'approved' | 'rejected';
  reviewer_id: string;
  comments?: string;
}

export async function updateApprovalStatus(
  approvalId: string, 
  update: ApprovalStatusUpdate
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/approvals/${approvalId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update approval status: ${response.status} ${errorText}`);
  }
}
