'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto p-6 max-w-2xl min-h-screen bg-background">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">개인정보처리방침</h1>
            </header>

            <main className="prose prose-sm max-w-none space-y-6 text-foreground/80">
                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">1. 개인정보의 처리 목적</h2>
                    <p>
                        '쉬운 파크골프 스코어'(이하 '앱')는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>사용자 스코어 관리 및 통계 분석</li>
                        <li>앱 내 사용자 이름 표시를 통한 개인화 서비스</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">2. 개인정보의 처리 및 보유 기간</h2>
                    <p>
                        앱은 원칙적으로 사용자의 데이터를 서버에 저장하지 않고 사용자의 기기(LocalStorage)에 저장합니다. 따라서 앱을 삭제하거나 브라우저 캐시를 삭제할 경우 데이터가 삭제됩니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">3. 처리하는 개인정보의 항목</h2>
                    <p>익명 기반의 서비스로, 직접적인 식별 정보(실명, 전화번호, 이메일 등)를 강제로 수집하지 않습니다.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>사용자가 직접 설정한 별명 (닉네임)</li>
                        <li>사용자가 직접 입력한 파크골프 스코어 정보</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">4. 개인정보의 제3자 제공</h2>
                    <p>앱은 사용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">5. 개인정보의 파기절차 및 파기방법</h2>
                    <p>
                        앱은 별도의 서버에 데이터를 저장하지 않으므로, 사용자가 앱 내에서 데이터를 초기화하거나 앱을 삭제하는 즉시 모든 데이터가 파기됩니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">6. 개인정보 보호책임자</h2>
                    <p>
                        개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <div className="bg-muted p-4 rounded-lg mt-2">
                        <p><strong>담당자:</strong> 하 용 휘</p>
                        <p><strong>이메일:</strong> hayonghwy@gmail.com</p>
                    </div>
                </section>

                <section className="text-sm border-t pt-8">
                    <p>공고일자: 2026년 01월 18일</p>
                    <p>시행일자: 2026년 01월 18일</p>
                </section>
            </main>
        </div>
    );
}
