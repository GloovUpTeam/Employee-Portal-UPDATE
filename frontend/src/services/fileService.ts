import { supabase } from '../config/supabaseClient';
import { FileAsset } from '../types';

const BUCKET_NAME = 'company_files';

export async function uploadFile(file: File, userId: string): Promise<FileAsset> {
    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw uploadError;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    // 3. Insert into 'files' table
    const fileRecord = {
        name: file.name,
        url: publicUrl,
        file_size: file.size,
        type: getSimpleFileType(file.name),
        uploaded_by: userId,
    };

    const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert([fileRecord])
        .select()
        .single();

    if (dbError) {
        console.error('DB Insert Error:', dbError);
        // Optional: Cleanup storage if DB fails? For now, risk orphan file.
        throw dbError;
    }

    return mapDbFileToAsset(dbData);
}

export async function fetchFiles(): Promise<FileAsset[]> {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch Files Error:', error);
        throw error;
    }

    return (data || []).map(mapDbFileToAsset);
}

export async function deleteFile(fileId: string, fileUrl: string) {
    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

    if (dbError) throw dbError;

    // 2. Delete from Storage (Optional but good practice)
    // Extract path from URL: .../company_files/userId/fileName...
    // This is tricky if URL format changes.
    // Ideally, we store the 'path' in DB too.
    // For now, we trust the DB delete is enough for the UI.
    // If we want strict cleanup, we'd need to parse the URL or store the path.
}

// Helpers

function mapDbFileToAsset(dbFile: any): FileAsset {
    return {
        id: dbFile.id,
        name: dbFile.name,
        url: dbFile.url,
        sizeBytes: dbFile.file_size,
        sizeLabel: formatFileSize(dbFile.file_size),
        type: dbFile.type as any || 'other',
        uploadedAt: dbFile.created_at,
        downloadUrl: dbFile.url,
        isNew: false
    };
}

function getSimpleFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx'].includes(ext || '')) return 'doc';
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return 'archive';
    return 'other';
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
