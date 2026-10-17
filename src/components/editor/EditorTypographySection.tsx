import React, { useEffect, useId, useState } from 'react';
import type { FontRole, FontSettings } from '../../types';
import { cleanFontFamily, DEFAULT_FONTS, FONT_CHOICES, fontVariables, loadGoogleFont } from '../../services/siteFonts';

const labels: Record<FontRole,string> = {body:'Body font', title:'Title font', label:'Label font', chinese:'Chinese font'};
function FontPicker({role,value,onChange}: {role:FontRole;value:string;onChange:(value:string)=>void}) {
  const id=useId();
  const options=FONT_CHOICES[role];
  const [custom,setCustom]=useState(!options.includes(value));
  const [status,setStatus]=useState('');
  useEffect(()=>{setCustom(!options.includes(value));},[value,role]);
  useEffect(()=>{
    let cancelled=false;
    if(!cleanFontFamily(value)) {setStatus('Enter a font family name, without a URL or embed code.');return;}
    setStatus('Loading preview…');
    const timer=window.setTimeout(async()=>{
      try {
        await loadGoogleFont(value);
        if(document.fonts) {
          const faces=await document.fonts.load(`400 16px ${JSON.stringify(cleanFontFamily(value))}`,role==='chinese'?'方舒颖 作品':'Artwork');
          if(!faces.length) throw new Error('Font unavailable. Check the family name.');
        }
        if(!cancelled)setStatus('Preview ready');
      } catch(error) {if(!cancelled)setStatus(error instanceof Error?error.message:'Font unavailable.');}
    },350);
    return()=>{cancelled=true;window.clearTimeout(timer);};
  },[value,role]);
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm">{labels[role]}</label>
    <select id={id} value={custom?'__custom__':value} onChange={event=>{
      if(event.target.value==='__custom__')setCustom(true);
      else {setCustom(false);onChange(event.target.value);}
    }} className="w-full p-2 border border-black/25 bg-white text-sm">
      {options.map(family=><option key={family} value={family}>{family}{family===DEFAULT_FONTS[role]?' (default)':''}</option>)}
      <option value="__custom__">Custom Google Font…</option>
    </select>
    {custom&&<input aria-label={`Custom ${labels[role].toLowerCase()} family`} value={value} maxLength={80} onChange={event=>onChange(event.target.value)} placeholder="Google Fonts family name" className="w-full p-2 border border-black/25 text-sm bg-white"/>}
    <p role="status" className="text-xs text-black/65 min-h-4">{status}</p>
  </div>;
}

export function EditorTypographySection({fonts,onChange}:{fonts:FontSettings;onChange:(fonts:FontSettings)=>void}) {
  return <section aria-label="Typography settings" className="p-6 border border-black/15 bg-white space-y-5">
    <div className="flex flex-wrap justify-between gap-3 items-baseline">
      <h3 className="font-editorial text-lg">2. Typography</h3>
      <button type="button" onClick={()=>onChange({...DEFAULT_FONTS})} className="text-xs underline decoration-dotted">Restore default fonts</button>
    </div>
    <p className="text-sm text-black/65">Choose a font for each role, or enter a family name from <a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Google Fonts</a>. Preview changes here, save your settings, then publish to GitHub.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {(Object.keys(labels) as FontRole[]).map(role=><FontPicker key={role} role={role} value={fonts[role]} onChange={value=>onChange({...fonts,[role]:value})}/>)}
    </div>
    <div aria-label="Live typography preview" style={fontVariables(fonts)} className="border-t border-black/10 pt-5 space-y-3">
      <p className="font-mono-quiet text-xs text-black/60">LIVE PREVIEW · WORK · 2026</p>
      <p className="font-editorial text-[26px] leading-tight"><span lang="zh-Hans">临摹</span>{' '}lapping emulations</p>
      <p className="font-sans body-copy">An evolving index of works, developing studies and working fragments.</p>
      <p lang="zh-Hans" className="font-chinese-noto text-base">作品、书籍、图像与工作笔记之间的联系。</p>
      <p className="font-editorial italic text-sm">archives and records · books and bookish things</p>
    </div>
  </section>;
}
