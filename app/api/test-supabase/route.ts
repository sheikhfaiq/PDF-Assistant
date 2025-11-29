// import { supabase } from '@/lib/supabaseClient';
// import { NextResponse } from 'next/server';

// export async function GET() {
//   try {
//     const { data, error } = await supabase
//       .from('documents')
//       .select('id, file_name')
//       .limit(5);

//     if (error) throw error;

//     return NextResponse.json({
//       message: 'Supabase connection successful!',
//       documents_found: data.length,
//       data,
//     });
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: 'Supabase connection failed', details: err.message },
//       { status: 500 }
//     );
//   }
// }
